"use client";
import React, { useState, useRef } from "react";
import {
  Loader2,
  Sparkles,
  Brain,
  Youtube,
  FileText,
  Type,
  Upload,
  AlignLeft,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea"; // Make sure you have this component
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { generateFlashcardsContent } from "@/actions/generateflashcards";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: Id<"folders">;
}

export default function FlashcardAIGenerateDialog({
  open,
  onOpenChange,
  folderId,
}: Props) {
  const saveFlashcards = useMutation(api.flashcards.saveAiFlashcards);
  const [numberOfFlashcards, setNumberOfFlashcards] = useState(5);
  const limitStatus = useQuery(api.subscriptions.canGenerateFlashcard, {
    count: numberOfFlashcards,
  });

  const [activeTab, setActiveTab] = useState("topic");

  // Inputs
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState(""); // <--- RESTORED
  const [manualText, setManualText] = useState(""); // <--- NEW
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Settings

  const [isMultipleChoice, setIsMultipleChoice] = useState(true);
  const [numberOfOptions, setNumberOfOptions] = useState(4); // <--- RESTORED

  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (limitStatus && !limitStatus.allowed) {
      toast.error("Daily flashcard limit reached.");
      return;
    }

    // Validation
    if (activeTab === "topic" && !topic.trim())
      return toast.error("Please enter a topic");
    if (activeTab === "text" && !manualText.trim())
      return toast.error("Please paste some text");
    if (activeTab === "youtube" && !youtubeUrl.trim())
      return toast.error("Please enter a URL");
    if (activeTab === "pdf" && !selectedFile)
      return toast.error("Please select a PDF");

    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append("count", numberOfFlashcards.toString());
      formData.append("isMcq", isMultipleChoice.toString());
      formData.append("optionsCount", numberOfOptions.toString());
      formData.append("description", description);

      // Handle Types
      if (activeTab === "topic") {
        formData.append("type", "topic");
        formData.append("topic", topic);
      } else if (activeTab === "text") {
        formData.append("type", "text");
        formData.append("text", manualText);
        formData.append("topic", topic || "Custom Text"); // Fallback topic
      } else if (activeTab === "youtube") {
        formData.append("type", "youtube");
        formData.append("url", youtubeUrl);
        formData.append("topic", topic || "Video Content");
      } else if (activeTab === "pdf") {
        formData.append("type", "pdf");
        if (selectedFile) formData.append("file", selectedFile);
        formData.append("topic", topic || selectedFile?.name || "Document");
      }

      const generatedCards = await generateFlashcardsContent(formData);

      await saveFlashcards({
        folderId,
        flashcards: generatedCards,
        isMultipleChoice,
      });

      toast.success(`Created ${generatedCards.length} flashcards!`);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error(
        "Failed to generate. " + (error instanceof Error ? error.message : "")
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setTopic("");
    setDescription("");
    setManualText("");
    setYoutubeUrl("");
    setSelectedFile(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!isGenerating) onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto scrollbar-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Flashcard Generator
          </DialogTitle>
          <DialogDescription>
            Generate study cards from any source material.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="topic"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="topic">
              <Type className="w-4 h-4 md:mr-2" />{" "}
              <span className="hidden md:inline">Topic</span>
            </TabsTrigger>
            <TabsTrigger value="text">
              <AlignLeft className="w-4 h-4 md:mr-2" />{" "}
              <span className="hidden md:inline">Text</span>
            </TabsTrigger>
            <TabsTrigger value="youtube">
              <Youtube className="w-4 h-4 md:mr-2" />{" "}
              <span className="hidden md:inline">Video</span>
            </TabsTrigger>
            <TabsTrigger value="pdf">
              <FileText className="w-4 h-4 md:mr-2" />{" "}
              <span className="hidden md:inline">PDF</span>
            </TabsTrigger>
          </TabsList>

          <div className="space-y-4 py-2 min-h-[150px]">
            {/* 1. TOPIC TAB */}
            <TabsContent value="topic" className="space-y-3 mt-0">
              <Label>Subject / Topic</Label>
              <Input
                placeholder="e.g. Photosynthesis, WWII, React Hooks..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isGenerating}
                autoFocus
              />
            </TabsContent>

            {/* 2. TEXT TAB (NEW) */}
            <TabsContent value="text" className="space-y-3 mt-0">
              <div className="grid gap-2">
                <Label>Topic Name (Optional)</Label>
                <Input
                  placeholder="e.g. My Lecture Notes"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Paste Content</Label>
                <Textarea
                  placeholder="Paste your notes, article, or summary here..."
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="min-h-[120px]"
                  disabled={isGenerating}
                />
              </div>
            </TabsContent>

            {/* 3. YOUTUBE TAB */}
            <TabsContent value="youtube" className="space-y-3 mt-0">
              <div className="grid gap-2">
                <Label>Topic Name (Optional)</Label>
                <Input
                  placeholder="e.g. History Documentary"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>YouTube URL</Label>
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
            </TabsContent>

            {/* 4. PDF TAB */}
            <TabsContent value="pdf" className="space-y-3 mt-0">
              <div className="grid gap-2">
                <Label>Topic Name (Optional)</Label>
                <Input
                  placeholder="e.g. Biology Textbook Ch.4"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              <div
                className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="flex items-center gap-2 text-primary font-medium ">
                    <FileText className="h-5 w-5" />

                    {selectedFile.name}
                    <Button
                      variant="ghost"
                      className=""
                      onClick={() => setSelectedFile(null)}
                      disabled={isGenerating}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload PDF
                    </span>
                  </>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* GLOBAL SETTINGS (Applies to all tabs) */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-4 border mt-2">
          {/* Description */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              Instructions / Focus
              <span className="text-xs text-muted-foreground font-normal">
                Optional
              </span>
            </Label>
            <Input
              placeholder="e.g. Focus on dates, vocab, or specific concepts..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Count */}
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={numberOfFlashcards}
                onChange={(e) => setNumberOfFlashcards(Number(e.target.value))}
                disabled={isGenerating}
              />
            </div>

            {/* MCQ Toggle */}
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex items-center justify-between border rounded-md px-3 h-10 bg-background">
                <span className="text-sm">
                  {isMultipleChoice ? "Multiple Choice" : "Q & A"}
                </span>
                <Switch
                  checked={isMultipleChoice}
                  onCheckedChange={setIsMultipleChoice}
                  disabled={isGenerating}
                />
              </div>
            </div>
          </div>

          {/* Option Count (Conditional) */}
          {isMultipleChoice && (
            <div className="space-y-2 animate-in slide-in-from-top-2">
              <Label>Options per Question</Label>
              <div className="flex items-center gap-2">
                {[2, 3, 4, 5].map((num) => (
                  <Button
                    key={num}
                    type="button"
                    variant={numberOfOptions === num ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNumberOfOptions(num)}
                    className="flex-1"
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="min-w-[140px]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
