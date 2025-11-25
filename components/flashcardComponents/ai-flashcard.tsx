"use client";
import React, { useState, useEffect } from "react";

import { Loader2, Sparkles, Brain } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useChat } from "@ai-sdk/react";
import { useAuth } from "@clerk/nextjs";
import { set } from "date-fns";

interface FlashcardAIGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: Id<"folders">;
}

const FlashcardAIGenerateDialog = ({
  open,
  onOpenChange,
  folderId,
}: FlashcardAIGenerateDialogProps) => {
  const folder = useQuery(api.folders.getFolderById, { folderId: folderId });
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [isMultipleChoice, setIsMultipleChoice] = useState(true);
  const [numberOfOptions, setNumberOfOptions] = useState(4);
  const [numberOfFlashcards, setNumberOfFlashcards] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const { messages, sendMessage, status, regenerate, error } = useChat();

  const { getToken } = useAuth();
  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    if (numberOfFlashcards < 1 || numberOfFlashcards > 20) {
      toast.error("Number of flashcards must be between 1 and 20");
      return;
    }

    if (isMultipleChoice && (numberOfOptions < 2 || numberOfOptions > 6)) {
      toast.error("Number of options must be between 2 and 6");
      return;
    }

    setIsGenerating(true);
    const token = await getToken({ template: "convex" });
    try {
      sendMessage(
        {
          text: `Generate ${numberOfFlashcards} flashcards for the topic "${topic}" with ${isMultipleChoice ? numberOfOptions : "no"} options. ${description}`,
          files: [], //to do add file upload to generate flashcard based on the files
        },
        {
          body: {
            webSearch: false,
            contextFolder: folder,
            convexToken: token,
          },
        }
      );

      if (status === "ready") {
        setIsGenerating(false);
        toast.success("Flashcards generated successfully");
        handleClose();
      }
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate flashcards"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setTopic("");
      setDescription("");
      setIsMultipleChoice(true);
      setNumberOfOptions(4);
      setNumberOfFlashcards(5);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-hidden ">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-2xl font-semibold">
              <Sparkles className="h-6 w-6 text-primary" />
              AI Flashcard Generator
            </DialogTitle>
          </div>
          <DialogDescription>
            Let AI create flashcards for you based on any topic
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Topic Input */}
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., World War II, Python Programming, Biology..."
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">
              Enter the subject or topic you want to study
            </p>
          </div>

          {/* Description Input (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              Description
              <span className="text-xs text-muted-foreground font-normal">
                (Optional)
              </span>
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Focus on arrays and functions, Include LIFO/FIFO concepts..."
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">
              Add specific focus areas or requirements for more targeted
              flashcards
            </p>
          </div>

          {/* Number of Flashcards */}
          <div className="space-y-2">
            <Label htmlFor="count">Number of Flashcards</Label>
            <Input
              id="count"
              type="number"
              min="1"
              max="20"
              value={numberOfFlashcards}
              onChange={(e) =>
                setNumberOfFlashcards(parseInt(e.target.value) || 5)
              }
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">
              How many flashcards to generate (1-20)
            </p>
          </div>

          {/* Multiple Choice Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="ai-multiple-choice" className="text-base">
                Multiple Choice
              </Label>
              <p className="text-sm text-muted-foreground">
                Generate multiple choice questions
              </p>
            </div>
            <Switch
              id="ai-multiple-choice"
              checked={isMultipleChoice}
              onCheckedChange={setIsMultipleChoice}
              disabled={isGenerating}
            />
          </div>

          {/* Number of Options (only for multiple choice) */}
          {isMultipleChoice && (
            <div className="space-y-2">
              <Label htmlFor="options">Number of Options</Label>
              <Input
                id="options"
                type="number"
                min="2"
                max="6"
                value={numberOfOptions}
                onChange={(e) =>
                  setNumberOfOptions(parseInt(e.target.value) || 4)
                }
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground">
                Options per question (2-6, default is 4)
              </p>
            </div>
          )}

          {/* AI Info Box */}
          <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <Brain className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Powered by Gemini AI</p>
              <p className="text-xs text-muted-foreground">
                AI will generate {numberOfFlashcards}{" "}
                {isMultipleChoice ? "multiple choice" : "written answer"}{" "}
                flashcard{numberOfFlashcards !== 1 ? "s" : ""} about{" "}
                {topic || "your topic"}
                {description && (
                  <span className="block mt-1">
                    <span className="font-medium">Focus:</span> {description}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Flashcards
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FlashcardAIGenerateDialog;
