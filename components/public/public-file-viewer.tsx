"use client";

import PDFViewer from "@/components/filescomponents/pdf-viewer";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Skeleton } from "../ui/skeleton";

interface PublicFileViewerProps {
  fileId: Id<"files">;
}

export const PublicFileViewer = ({ fileId }: PublicFileViewerProps) => {
  const file = useQuery(api.files.getFile, { fileId: fileId });
  if (file === undefined || file.fileurl === null) {
    return (
      <div className="container mx-auto p-6 h-full flex flex-col space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="flex-1 w-full" />
      </div>
    );
  }
  return (
    <div className="h-[calc(100vh-12rem)] w-full">
      <PDFViewer fileUrl={file.fileurl} fileName={file.file.fileName} />
    </div>
  );
};
