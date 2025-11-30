"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import PublicHeader from "@/components/public/public-header"; // Adjust path if needed based on your structure
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  File as FileIcon,
  CreditCard,
  Folder,
  Layers,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function PublicFolderPage() {
  const params = useParams();
  const publicId = params.publicId as Id<"folders">;

  // Fetch the current folder
  const folder = useQuery(api.public.getPublicFolderById, {
    folderId: publicId,
  });

  // Fetch contents
  const subfolders = useQuery(api.public.getPublicFolderChildren, {
    parentId: publicId,
  });
  const notes = useQuery(api.public.getPublicFolderNotes, {
    folderId: publicId,
  });
  const files = useQuery(api.public.getPublicFolderFiles, {
    folderId: publicId,
  });
  const flashcards = useQuery(api.public.getPublicFolderFlashcards, {
    folderId: publicId,
  });

  // Loading State
  if (
    folder === undefined ||
    subfolders === undefined ||
    notes === undefined ||
    files === undefined ||
    flashcards === undefined
  ) {
    return (
      <div className="flex flex-col h-full">
        <div className="w-full h-[30vh] bg-muted/20 animate-pulse" />
        <div className="p-6 max-w-5xl mx-auto w-full space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // 404 / Private State
  if (!folder) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 p-6 text-center">
        <div className="bg-muted p-4 rounded-full">
          <Layers className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Content Unavailable</h2>
        <p className="text-muted-foreground">
          This folder does not exist or is currently private.
        </p>
      </div>
    );
  }

  // Calculate Totals
  const stats = [
    {
      label: "Subfolders",
      count: subfolders.length,
      icon: Folder,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Notes",
      count: notes.length,
      icon: FileText,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      label: "Flashcards",
      count: flashcards.length,
      icon: CreditCard,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Files",
      count: files.length,
      icon: FileIcon,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto scrollbar-hide">
      {/* Main Content */}
      <div className="flex-1  md:p-10 max-w-6xl mx-auto w-full">
        <div className="mb-8">
          {folder.description && (
            <p className="mt-2 text-base max-w-2xl drop-shadow-sm line-clamp-2">
              {folder.description}
            </p>
          )}
          <h2 className="text-xl font-semibold mb-2">Content Overview:</h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat) => (
            <Card key={stat.label} className="border ">
              <CardContent className="p-6 flex  items-center justify-center text-center">
                {/* Icon Container */}
                <div className={`p-3 rounded-full ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>

                {/* Numbers */}
                <div className="space-y-1">
                  <div className="text-2xl font-bold tracking-tight">
                    {stat.count}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground uppercase ">
                    {stat.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
