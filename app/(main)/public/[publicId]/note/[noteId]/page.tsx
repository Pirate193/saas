import { Id } from "@/convex/_generated/dataModel";
import { PublicNoteViewer } from "@/components/public/public-note-viewer";

export default async function PublicNotePage({
  params,
}: {
  params: { publicId: string; noteId: string };
}) {
  const { publicId, noteId } = await params;

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <PublicNoteViewer noteId={noteId as Id<"notes">} />
    </div>
  );
}
