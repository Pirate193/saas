"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { SavedFolderTreeItem } from "@/components/saved/SavedFolderTree";
import { ExploreCard } from "@/components/explore/ExploreCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  File as FileIcon,
  CreditCard,
  Folder,
  BookmarkCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import SavedDashboard from "./dashboard";

export default function SavedFolderPage() {
  const params = useParams();
  const router = useRouter();
  const savedId = params.savedId as Id<"folders">;

  // Fetch the current folder
  const folder = useQuery(api.saving.getFolderById, {
    folderId: savedId,
  });

  // Fetch contents
  const subfolders = useQuery(api.saving.getFolderChildren, {
    parentId: savedId,
  });
  const notes = useQuery(api.saving.getFolderNotes, {
    folderId: savedId,
  });
  const files = useQuery(api.saving.getFolderFiles, {
    folderId: savedId,
  });
  const flashcards = useQuery(api.saving.getFolderFlashcards, {
    folderId: savedId,
  });

  if (folder === undefined) {
    return (
      <div className="p-6">
        <Skeleton className="h-12 w-1/3 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-full w-full min-h-[300px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!folder) {
    return <div className="p-6">Folder not found or is private.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <SavedDashboard folderId={savedId} />
    </div>
  );
}
