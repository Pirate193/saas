"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import {
  FileText,
  CreditCard,
  File as FileIcon,
  Folder,
  BookmarkCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import Image from "next/image";

interface Props {
  folderId: Id<"folders">;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}

const SavedDashboard = ({ folderId }: Props) => {
  const notes = useQuery(api.saving.getFolderNotes, { folderId: folderId });
  const files = useQuery(api.saving.getFolderFiles, { folderId: folderId });
  const folder = useQuery(api.saving.getFolderById, { folderId: folderId });
  const flashcards = useQuery(api.saving.getFolderFlashcards, {
    folderId: folderId,
  });
  const geturl = useQuery(
    api.folders.getUrl,
    folder?.bannerId ? { storageId: folder.bannerId } : "skip"
  );

  // Conditionally fetch parent folder only if parentId exists
  const parentfolder = useQuery(
    api.saving.getFolderById,
    folder?.parentId ? { folderId: folder.parentId as Id<"folders"> } : "skip"
  );

  if (!folder || !notes || !files) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hidden">
      {/* Banner Section */}
      <div className="relative w-full h-[30vh] min-h-[200px] shrink-0 bg-muted/30">
        {/* Banner Image */}
        {geturl ? (
          <Image
            src={geturl}
            alt="Folder Banner"
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50" />
        )}

        {/* Dark Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Top Navigation */}
        <div className="absolute top-0 left-0 w-full p-4 z-10 flex justify-between items-start">
          <div className="flex items-center gap-2 text-white/90">
            <SidebarTrigger
              size="lg"
              className="text-white hover:bg-white/20 hover:text-white"
            />

            {/* Breadcrumb */}
            {folder.parentId && parentfolder && (
              <Breadcrumb>
                <BreadcrumbList className="text-white/80 sm:text-white/90">
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link
                        href={`/saved/${parentfolder._id}`}
                        className="flex items-center gap-2 hover:text-white transition-colors"
                      >
                        <BookmarkCheck className="h-4 w-4" />
                        <span>{parentfolder.name}</span>
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="text-white/50" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="flex items-center gap-2 text-white font-medium">
                      <BookmarkCheck className="h-4 w-4" />
                      {folder.name}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>

          {/* Read-only badge */}
          <div className="bg-black/40 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-full text-white text-sm">
            Read-only
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6 p-6 -mt-4 relative z-0">
        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">{folder.name}</h1>
          {folder.description && (
            <p className="text-muted-foreground text-lg">
              {folder.description}
            </p>
          )}
          <p className="text-sm text-muted-foreground italic">
            This is a saved copy from a public folder
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notes.length}</div>
              <p className="text-xs text-muted-foreground">documents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Flashcards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {flashcards?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">cards</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileIcon className="h-4 w-4" />
                Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{files.length}</div>
              <p className="text-xs text-muted-foreground">uploaded</p>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <BookmarkCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Saved Folder</h3>
                <p className="text-sm text-muted-foreground">
                  This folder was saved from public sharing. You can view all
                  content but cannot make changes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SavedDashboard;
