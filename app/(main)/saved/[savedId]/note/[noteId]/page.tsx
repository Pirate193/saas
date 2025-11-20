"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { PublicNoteViewer } from "@/components/public/public-note-viewer";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function SavedNotePage() {
  const params = useParams();
  const savedId = params.savedId as Id<"folders">;
  const noteId = params.noteId as Id<"notes">;

  const note = useQuery(api.saving.getNote, {
    folderId: savedId,
    noteId: noteId,
  });

  if (note === undefined) {
    return (
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (!note) {
    return <div className="p-6">Note not found.</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{note.title}</h1>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Last updated: {format(new Date(note.updatedAt), "PPP")}
          </p>
          <Badge variant="destructive">Read-only</Badge>
        </div>
      </div>

      <PublicNoteViewer noteId={noteId} />
    </div>
  );
}
