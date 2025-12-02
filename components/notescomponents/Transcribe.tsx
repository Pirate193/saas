"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mic,
  Monitor,
  LayoutTemplate,
  Youtube,
  Loader2,
  Square,
  Circle,
  Video,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface TranscribeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTranscribe: (text: string) => void; // Callback when transcription is done
}

export function TranscribeDialog({
  open,
  onOpenChange,
  onTranscribe,
}: TranscribeDialogProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<"mic" | "screen" | "both">("screen");
  const [transcript, setTranscript] = useState("");

  // Ref to store the actual media stream and recorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // --- RECORDING LOGIC ---

  const startRecording = async (mode: "mic" | "screen" | "both") => {
    try {
      let stream: MediaStream;

      if (mode === "mic") {
        // 1. Microphone Only
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else if (mode === "screen") {
        // 2. Screen Only (This triggers the Browser "Choose Tab/Window" popup)
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true, // This captures System Audio (e.g. video playing in a tab)
        });
      } else {
        // 3. Screen + Microphone (The Tricky Part)
        // We need to get TWO streams and merge them
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true, // System audio
        });

        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: true, // User voice
        });

        // Create a new stream combining screen video + system audio + mic audio
        stream = new MediaStream([
          ...screenStream.getVideoTracks(),
          ...screenStream.getAudioTracks(),
          ...micStream.getAudioTracks(),
        ]);
      }

      // Store stream to stop it later
      streamRef.current = stream;

      // Show preview if video exists
      if (videoPreviewRef.current && (mode === "screen" || mode === "both")) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }

      // Initialize Recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks (turns off the red "recording" dot in browser)
        stream.getTracks().forEach((track) => track.stop());

        // Create the final video/audio blob
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        await handleTranscribeFile(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Could not start recording. Permission denied?");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- TRANSCRIPTION MOCK HANDLER ---

  const handleTranscribeFile = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      console.log("File ready for upload. Size:", blob.size);

      // Mock delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockText = "This is the transcribed text from the recording...";
      onTranscribe(mockText);
      toast.success("Transcription complete!");
    } catch (error) {
      toast.error("Transcription failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToNote = () => {};

  const handleYoutubeTranscribe = async () => {
    if (!youtubeUrl) return;
    setIsProcessing(true);
    // TODO: Send URL to backend to download audio & transcribe
    setTimeout(() => {
      setIsProcessing(false);
      onOpenChange(false);
      onTranscribe("Transcribed text from YouTube...");
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Transcribe Content</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="record" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="record">
              {" "}
              <Mic className="w-4 h-4" /> Record{" "}
            </TabsTrigger>
            <TabsTrigger value="youtube">
              {" "}
              <Video className="w-4 h-4" /> YouTube Video
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
            <Button
              className="w-full"
              onClick={handleYoutubeTranscribe}
              disabled={!youtubeUrl || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <Youtube className="mr-2 h-4 w-4" />
              )}
              Transcribe Video
            </Button>
          </TabsContent>

          {/* --- RECORD TAB --- */}
          <TabsContent value="record" className="space-y-6 py-4">
            {/* Live Preview Area */}
            {isRecording && (
              <div className="rounded-lg overflow-hidden border bg-black aspect-video relative">
                <video
                  ref={videoPreviewRef}
                  className="w-full h-full object-contain"
                  muted // Mute locally so you don't hear yourself echo
                />
                <div className="absolute top-2 right-2 flex items-center gap-2 bg-red-500/90 text-white px-2 py-1 rounded-md text-xs font-bold animate-pulse">
                  <Circle className="w-3 h-3 fill-current" />
                  REC
                </div>
              </div>
            )}

            {!isRecording && !isProcessing && (
              <div className="flex flex-col gap-4">
                <div className="flex gap-4 items-center justify-between ">
                  <p>Audio Source</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className=""
                      onClick={() => setMode("mic")}
                    >
                      <Mic className="h-8 w-8" />
                      <span>Mic</span>
                    </Button>

                    <Button
                      variant="outline"
                      className=""
                      onClick={() => setMode("screen")}
                    >
                      <Monitor className="h-8 w-8" />
                      <span>Screen</span>
                    </Button>

                    <Button
                      variant="outline"
                      className=""
                      onClick={() => setMode("both")}
                    >
                      <div className="flex">
                        <Monitor className="h-6 w-6" />
                        <Plus className="h-6 w-6" />
                        <Mic className="h-6 w-6 " />
                      </div>
                    </Button>
                  </div>
                </div>
                <div>
                  <p>Microphone</p>
                  {/* TODO: Add Microphone selection */}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 w-full  ">
              {isRecording ? (
                <Button
                  variant="destructive"
                  className="  h-12 text-lg"
                  onClick={stopRecording}
                >
                  <Square className="mr-2 h-5 w-5 fill-current" />
                  Stop & Transcribe
                </Button>
              ) : (
                <Button
                  className=" h-12 text-lg"
                  onClick={() => startRecording(mode)}
                >
                  Start Recording
                </Button>
              )}
              <Button
                className=" h-12 text-lg"
                onClick={handleAddToNote}
                disabled={!transcript}
              >
                Add to Note
              </Button>
            </div>
            <div>
              <p>Transcript</p>
              {/* todo show the transcript so user can review it before adding to note */}
            </div>

            {isProcessing && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Transcribing audio...</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
