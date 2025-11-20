"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { PublicFileViewer } from "@/components/public/public-file-viewer";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function SavedFilePage() {
  const params = useParams();
  const savedId = params.savedId as Id<"folders">;
  const fileId = params.fileId as Id<"files">;

  const file = useQuery(api.saving.getFile, {
    folderId: savedId,
    fileId: fileId,
  });

  if (file === undefined) {
    return (
      <div className="container mx-auto p-6 h-full flex flex-col space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="flex-1 w-full" />
      </div>
    );
  }

  if (!file) {
    return <div className="p-6">File not found.</div>;
  }

  return (
    <div className="container mx-auto p-4 lg:p-6 h-[calc(100vh-4rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{file.fileName}</h1>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              {file.fileType} • Uploaded{" "}
              {format(new Date(file._creationTime), "PPP")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 border rounded-lg bg-muted/10 overflow-hidden">
        <PublicFileViewer fileId={fileId} />
      </div>
    </div>
  );
}
