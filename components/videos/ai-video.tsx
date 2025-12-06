"use client";

import { Id } from "@/convex/_generated/dataModel";
import { useRef, useState } from "react";
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
import { Textarea } from "../ui/textarea";
import { Brain, FileText, Loader2, Upload, X } from "lucide-react";
import { Button } from "../ui/button";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { generateVideo } from "@/actions/generateVideo";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: Id<"folders">;
}

const Aivideo = ({ open, onOpenChange, folderId }: Props) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const newvideo = useMutation(api.videos.addVideo);
  const [prompt, setPrompt] = useState("");
  const { getToken } = useAuth();

  const handleGenerate = async () => {
    setIsGenerating(true);
    if (!prompt.trim()) return toast.error("Please enter a prompt");
    try {
      const token = await getToken({ template: "convex" });
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("folderId", folderId);
      if (selectedFile) formData.append("file", selectedFile);
      formData.append("convexToken", token as string);
      const response = fetch("/api/generatevideo", {
        method: "POST",
        body: formData,
      });
      toast.success("Video submitted we will notify you when it is ready");
      onOpenChange(false);
    } catch (error) {
      console.log(error);
      toast.error("Failed to generate video");
    } finally {
      setIsGenerating(false);
    }
  };
  const handleFileRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents opening the file picker again
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Video</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-sm font-medium">
              Video Prompt
            </Label>
            <Textarea
              id="prompt"
              placeholder="e.g. Explain the Pythagorean theorem using a visual proof with squares..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] resize-none text-base"
              disabled={isGenerating}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Reference Material{" "}
              <span className="text-muted-foreground font-normal">
                (Optional PDF)
              </span>
            </Label>

            <div
              className={cn(
                "relative group cursor-pointer border-2 border-dashed rounded-xl transition-all duration-200",
                selectedFile
                  ? "border-primary/20 bg-primary/5 p-4"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 p-8"
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="application/pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />

              {selectedFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-background flex items-center justify-center border shadow-sm">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={handleFileRemove}
                    disabled={isGenerating}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground/80">
                      Click to upload PDF
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Max file size 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
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
};

export default Aivideo;
