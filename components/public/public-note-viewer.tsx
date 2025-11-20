"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Dynamically import BlocknoteEditor to avoid SSR issues
const BlocknoteEditor = dynamic(
  () => import("@/components/notescomponents/blocknote-editor"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[500px] w-full" />,
  }
);

interface PublicNoteViewerProps {
  noteId: Id<"notes">;
}

export const PublicNoteViewer = ({ noteId }: PublicNoteViewerProps) => {
  const note = useQuery(api.notes.getNoteId, { noteId: noteId });

  if (note === undefined) {
    return (
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }
  return (
    <div className="w-full max-w-4xl mx-auto">
      <BlocknoteEditor
        initialContent={note.content}
        onChangeContent={() => {}} // Read-only, no change handler needed
        editable={false}
      />
    </div>
  );
};
