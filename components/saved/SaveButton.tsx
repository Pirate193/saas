"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface SaveButtonProps {
  folderId: Id<"folders">;
  variant?: "default" | "ghost" | "outline";
}

export const SaveButton = ({
  folderId,
  variant = "outline",
}: SaveButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const isSaved = useQuery(api.saving.checkIfSaved, { folderId });
  const saveMutation = useMutation(api.saving.savefolder);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent onClick events

    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await saveMutation({ folderId });
      if (result.saved) {
        toast.success("Folder saved successfully!");
      } else {
        toast.success("Folder removed from saved!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save folder");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSaved === undefined) {
    return (
      <Button variant={variant} size="sm" disabled>
        <Bookmark className="h-4 w-4 mr-2" />
        Save
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleSave}
      disabled={isLoading}
    >
      {isSaved ? (
        <>
          <BookmarkCheck className="h-4 w-4 mr-2 fill-current" />
          Saved
        </>
      ) : (
        <>
          <Bookmark className="h-4 w-4 mr-2" />
          Save
        </>
      )}
    </Button>
  );
};
