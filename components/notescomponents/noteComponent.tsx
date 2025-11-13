"use client";

import { useEffect, useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import BlocknoteEditor from "./blocknote-editor";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface NoteComponentProps {
  noteId: Id<"notes">;
}

const NoteComponent = ({ noteId }: NoteComponentProps) => {
  const note = useQuery(api.notes.getNoteId, { noteId });
  const updateContent = useMutation(api.notes.updateContent);
  const updateTitle = useMutation(api.notes.renameNote);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Refs for debouncing
  const contentTimerRef = useRef<NodeJS.Timeout | null>(null);
  const titleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // // Initialize from note data
  // useEffect(() => {
  //   if (note) {
  //     setTitle(note.title);
  //     setContent(note.content || ""); // Default to empty string if content is undefined
  //   }
  // }, [note]); // Only run when note ID changes

  // Debounced content save
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setIsSaving(true);

    // Clear previous timer
    if (contentTimerRef.current) {
      clearTimeout(contentTimerRef.current);
    }

    // Set new timer
    contentTimerRef.current = setTimeout(async () => {
      try {
        await updateContent({
          noteId,
          content: newContent,
        });
      } catch (error) {
        console.error("Failed to save content:", error);
      } finally {
        setIsSaving(false);
      }
    }, 5000); // 5 second debounce
  };

  // Debounced title save
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setIsSaving(true);

    // Clear previous timer
    if (titleTimerRef.current) {
      clearTimeout(titleTimerRef.current);
    }

    // Set new timer
    titleTimerRef.current = setTimeout(async () => {
      try {
        await updateTitle({
          noteId,
          title: newTitle,
        });
      } catch (error) {
        console.error("Failed to save title:", error);
      } finally {
        setIsSaving(false);
      }
    }, 500); // 0.5 second debounce for title
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (contentTimerRef.current) {
        clearTimeout(contentTimerRef.current);
      }
      if (titleTimerRef.current) {
        clearTimeout(titleTimerRef.current);
      }
    };
  }, []);

  // Loading state
  if (!note) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    
      <div className="relative flex-1 p-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden   ">
        <BlocknoteEditor
          initialContent={note.content || ""}
          onChangeContent={handleContentChange}
        />
           <div className="sticky bottom-0 flex items-center gap-2 text-xs text-muted-foreground justify-end pt-2 ">
          <span>
            Last edited: {new Date(note.updatedAt).toLocaleString()}
          </span>
          {isSaving && (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}
        </div>
      </div>
  );
};

export default NoteComponent;