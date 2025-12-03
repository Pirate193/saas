"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mic,
  Monitor,
  Youtube,
  Loader2,
  Square,
  Circle,
  Video,
  Plus,
  RefreshCcw,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { markdownToBlockNote } from "@/lib/convertmarkdowntoblock";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Response } from "../ai-elements/response";
import { YoutubeTranscribe } from "@/actions/youtubeTranscript";
import ReactMarkdown from "react-markdown";

interface TranscribeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: Id<"notes">;
}
interface AudioDevice {
  deviceId: string;
  label: string;
}
export function TranscribeDialog({
  open,
  onOpenChange,
  noteId,
}: TranscribeDialogProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<"mic" | "screen" | "both">("screen");
  const [transcript, setTranscript] = useState("");
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>("");
  const [youtubeTranscript, setYoutubeTranscript] = useState("");
  const [youtubeProcessing, setYoutubeProcessing] = useState(false);
  const [addedTranscript, setAddedTranscript] = useState(false);

  // Convex mutations/queries
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const updateNoteContent = useMutation(api.notes.updateContent);
  const currentNote = useQuery(api.notes.getNoteId, { noteId });

  // Refs for media handling
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // --- RECORDING LOGIC ---

  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request permission first to get labels
        await navigator.mediaDevices.getUserMedia({ audio: true });

        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices
          .filter((device) => device.kind === "audioinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label:
              device.label || `Microphone ${device.deviceId.slice(0, 5)}...`,
          }));

        setAudioDevices(audioInputs);
        if (audioInputs.length > 0) {
          setSelectedMicId(audioInputs[0].deviceId);
        }
      } catch (err) {
        console.error("Error fetching devices:", err);
      }
    };

    if (open) {
      getDevices();
    }
  }, [open]);
  const startRecording = async (selectedMode: "mic" | "screen" | "both") => {
    try {
      let stream: MediaStream;
      const audioConstraints = selectedMicId
        ? { deviceId: { exact: selectedMicId } }
        : true;

      if (selectedMode === "mic") {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
        });
      } else if (selectedMode === "screen") {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
      } else {
        // Screen + Mic: Merge streams
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
        });

        stream = new MediaStream([
          ...screenStream.getVideoTracks(),
          ...screenStream.getAudioTracks(),
          ...micStream.getAudioTracks(),
        ]);
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          stopRecording(); // Trigger our app's stop logic
        };
      }

      streamRef.current = stream;

      // Show preview
      if (
        videoPreviewRef.current &&
        (selectedMode === "screen" || selectedMode === "both")
      ) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }

      // Initialize Recorder
      // Try to use a mime type that is widely supported
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release hardware
        stream.getTracks().forEach((track) => track.stop());

        const blob = new Blob(chunksRef.current, { type: mimeType });
        await handleTranscribeFile(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscript(""); // Clear previous transcript
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Could not start recording. Permission denied?");
    }
  };

  const stopRecording = () => {
    // Check if state is recording to prevent double-calls
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- TRANSCRIPTION LOGIC ---

  const handleTranscribeFile = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      toast.info("Uploading recording...");

      // 1. Upload to Convex (Temporary storage)
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });

      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();

      toast.info("AI is analyzing... This may take a minute.");

      // 2. Send to Next.js Route
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: JSON.stringify({ storageId }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Processing failed");
      }

      const data = await response.json();
      setTranscript(data.transcript);
      toast.success("Transcription ready to review!");
    } catch (error) {
      console.error(error);
      toast.error("Transcription failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToNote = async () => {
    if (!transcript || !currentNote) return;

    try {
      // 1. Convert Markdown to BlockNote JSON
      const BlocksString = markdownToBlockNote(transcript);

      // 4. Save to Database
      await updateNoteContent({
        noteId: noteId,
        content: BlocksString,
      });

      toast.success("Notes added successfully!");
      onOpenChange(false); // Close dialog
      setTranscript(""); // Reset
    } catch (error) {
      console.error("Failed to add notes:", error);
      toast.error("Failed to add notes to editor.");
    }
  };

  const handleYoutubeTranscribe = async () => {
    if (!youtubeUrl) return;
    setYoutubeProcessing(true);
    try {
      const { transcript } = await YoutubeTranscribe(youtubeUrl);
      if (!transcript) {
        throw new Error("Transcription failed");
      }
      setYoutubeTranscript(transcript);
    } catch (error) {
      console.log(error);
    } finally {
      setYoutubeProcessing(false);
    }
  };

  const handleYoutubeAddToNote = async () => {
    if (!youtubeTranscript || !currentNote) return;
    setAddedTranscript(true);

    try {
      // 1. Convert Markdown to BlockNote JSON
      const BlocksString = markdownToBlockNote(youtubeTranscript);

      // 4. Save to Database
      await updateNoteContent({
        noteId: noteId,
        content: BlocksString,
      });

      toast.success("Notes added successfully!");
      setAddedTranscript(false);
      onOpenChange(false); // Close dialog
      setYoutubeTranscript(""); // Reset
    } catch (error) {
      console.error("Failed to add notes:", error);
      toast.error("Failed to add notes to editor.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]  max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-hidden">
        <DialogHeader>
          <DialogTitle>Transcribe Notes</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="record" className="w-full">
          <TabsList className="">
            <TabsTrigger value="record">
              <Mic className="w-4 h-4 mr-2" /> Record
            </TabsTrigger>
            <TabsTrigger value="youtube">
              <Youtube className="w-4 h-4 mr-2" /> YouTube Video
            </TabsTrigger>
          </TabsList>

          {/* --- YOUTUBE TAB --- */}
          <TabsContent value="youtube" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>YouTube URL</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                className=""
                onClick={handleYoutubeTranscribe}
                disabled={!youtubeUrl || youtubeProcessing}
              >
                {youtubeProcessing ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <Youtube className="mr-2 h-4 w-4" />
                )}
                Transcribe Video
              </Button>
              <Button
                className=""
                onClick={handleYoutubeAddToNote}
                disabled={!youtubeTranscript || !currentNote}
              >
                {addedTranscript ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin mr-2" />
                    <p>Adding to Notes...</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plus className="mr-2 h-4 w-4" />
                    <p>Add to Notes</p>
                  </div>
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <Label>Transcript Preview</Label>
              {youtubeTranscript && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(youtubeTranscript);
                      toast.success("Transcript copied to clipboard!");
                    }}
                    className="h-6 text-xs text-muted-foreground"
                  >
                    <Copy className="w-3 h-3 mr-1" /> Copy
                  </Button>
                </div>
              )}
            </div>
            <div className="min-h-[150px] max-h-[300px] w-full rounded-md border bg-muted/30 px-4 py-3 text-sm overflow-y-auto whitespace-pre-wrap font-mono">
              {youtubeTranscript ? (
                <Response>{youtubeTranscript}</Response>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 italic">
                  {youtubeProcessing ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span>AI is transcribing the video...</span>
                    </div>
                  ) : (
                    <Response>
                      No transcript yet. Record a session to begin.
                    </Response>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* --- RECORD TAB --- */}
          <TabsContent value="record" className="space-y-6 py-4">
            {/* Live Preview / Recording State */}
            {isRecording ? (
              <div className="rounded-lg overflow-hidden border bg-black aspect-video relative shadow-inner">
                <video
                  ref={videoPreviewRef}
                  className="w-full h-full object-contain"
                  muted // Mute locally
                />
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/90 text-white px-3 py-1.5 rounded-full text-xs font-bold animate-pulse shadow-lg">
                  <Circle className="w-3 h-3 fill-current" />
                  RECORDING
                </div>
              </div>
            ) : (
              !isProcessing && (
                <div className="flex flex-col gap-6">
                  <div className="flex  gap-2 justify-between items-center">
                    <Label className="text-base font-medium">
                      Audio Source
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant={mode === "mic" ? "default" : "outline"}
                        className="flex gap-2"
                        onClick={() => setMode("mic")}
                      >
                        <Mic
                          className={`h-6 w-6 ${mode === "mic" ? "text-white" : "text-orange-500"}`}
                        />
                        <span className="text-xs">Mic</span>
                      </Button>

                      <Button
                        variant={mode === "screen" ? "default" : "outline"}
                        className="flex gap-2"
                        onClick={() => setMode("screen")}
                      >
                        <Monitor
                          className={`h-6 w-6 ${mode === "screen" ? "text-white" : "text-blue-500"}`}
                        />
                        <span className="text-xs">Screen</span>
                      </Button>

                      <Button
                        variant={mode === "both" ? "default" : "outline"}
                        className="flex gap-2"
                        onClick={() => setMode("both")}
                      >
                        <div className="flex items-center">
                          <Monitor
                            className={`h-5 w-5 ${mode === "both" ? "text-white" : "text-blue-500"}`}
                          />
                          <Plus className="h-3 w-3 mx-1 opacity-50" />
                          <Mic
                            className={`h-5 w-5 ${mode === "both" ? "text-white" : "text-orange-500"}`}
                          />
                        </div>
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Label>Microphone</Label>
                      <RefreshCcw
                        className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-foreground"
                        onClick={() => {
                          // Re-trigger permission check to refresh list
                          navigator.mediaDevices
                            .getUserMedia({ audio: true })
                            .then(() => {
                              navigator.mediaDevices
                                .enumerateDevices()
                                .then((devices) => {
                                  const audioInputs = devices
                                    .filter((d) => d.kind === "audioinput")
                                    .map((d) => ({
                                      deviceId: d.deviceId,
                                      label: d.label || "Unknown Mic",
                                    }));
                                  setAudioDevices(audioInputs);
                                });
                            });
                        }}
                      />
                    </div>
                    <Select
                      value={selectedMicId}
                      onValueChange={setSelectedMicId}
                      disabled={mode === "screen"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select microphone" />
                      </SelectTrigger>
                      <SelectContent>
                        {audioDevices.map((device) => (
                          <SelectItem
                            key={device.deviceId}
                            value={device.deviceId}
                          >
                            {device.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )
            )}

            {/* Transcript Preview Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Transcript Preview</Label>
                {transcript && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(transcript);
                        toast.success("Transcript copied to clipboard!");
                      }}
                      className="h-6 text-xs text-muted-foreground"
                    >
                      <Copy className="w-3 h-3 mr-1" /> Copy
                    </Button>
                  </div>
                )}
              </div>
              <div className="min-h-[150px] max-h-[300px] w-full rounded-md border bg-muted/30 px-4 py-3 text-sm overflow-y-auto whitespace-pre-wrap font-mono">
                {transcript ? (
                  <Response>{transcript}</Response>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 italic">
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span>AI is watching the class...</span>
                      </div>
                    ) : (
                      <Response>
                        No transcript yet. Record a session to begin.
                      </Response>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {isRecording ? (
                <Button
                  variant="destructive"
                  className="h-12 text-base font-medium shadow-sm hover:shadow-md transition-all"
                  onClick={stopRecording}
                >
                  <Square className="mr-2 h-4 w-4 fill-current" />
                  Stop
                </Button>
              ) : (
                <Button
                  className="h-12 text-base font-medium shadow-sm hover:shadow-md transition-all"
                  onClick={() => startRecording(mode)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    "Processing..."
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
                      Start Recording
                    </>
                  )}
                </Button>
              )}

              <Button
                onClick={handleAddToNote}
                disabled={!transcript || isProcessing}
                variant="secondary"
                className="h-12 text-base font-medium border shadow-sm hover:bg-green-50 hover:text-green-700 hover:border-green-200 dark:hover:bg-green-900/20 dark:hover:text-green-400 transition-colors"
              >
                {addedTranscript ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin mr-2" />
                    <p>Adding to Notes...</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plus className="mr-2 h-4 w-4" />
                    <p>Add to Notes</p>
                  </div>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
