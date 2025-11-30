"use client";

import { MasteryProgress } from "@/components/dashboard/masteryprogress";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Sparkles,
  Upload,
  RotateCcw,
  Brain,
  TrendingUp,
  Zap,
  SlashIcon,
  Folder,
  Globe,
  ImageIcon,
  Loader2,
  Notebook,
  File,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { toast } from "sonner";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

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
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-96" />
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}

const Dashboard = ({ folderId }: Props) => {
  const stats = useQuery(api.flashcards.fetchStudyStats, {
    folderId: folderId,
  });
  const notes = useQuery(api.notes.fetchNotesInFolder, { folderId: folderId });
  const files = useQuery(api.files.fetchfiles, { folderId: folderId });
  const folder = useQuery(api.folders.getFolderById, { folderId: folderId });
  const allfolders = useQuery(api.folders.fetchFolders);
  const flashcards = useQuery(api.flashcards.fetchFlashcards, {
    folderId: folderId,
  });
  const makepublic = useMutation(api.public.makePublic);
  const geturl = useQuery(
    api.folders.getUrl,
    folder?.bannerId ? { storageId: folder.bannerId } : "skip"
  );
  const uploadBanner = useMutation(api.folders.addbanner);
  const generateurl = useMutation(api.files.generateUploadUrl);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Conditionally fetch parent folder only if parentId exists
  const parentfolder = useQuery(
    api.folders.getFolderById,
    folder?.parentId ? { folderId: folder.parentId as Id<"folders"> } : "skip"
  );

  if (!folder || !stats || !notes || !files || !allfolders) {
    return <DashboardSkeleton />;
  }
  const subfoldersCount = allfolders.filter(
    (f) => f.parentId === folder._id
  ).length;

  const masteryPercentage = (stats.masteredCards / stats.totalCards) * 100 || 0;

  const handleMakepublic = async () => {
    try {
      await makepublic({ folderId: folderId });
      toast.success(
        folder.isPublic ? "Folder made private" : "Folder made public"
      );
    } catch (error) {
      toast.error("Failed to update folder visibility");
    }
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    try {
      const uploadurl = await generateurl();
      const results = await fetch(uploadurl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await results.json();
      await uploadBanner({ folderId: folderId, storageId: storageId });
      toast.success("Banner updated successfully");
    } catch (error) {
      toast.error("Failed to upload banner");
      console.error(error);
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hidden">
      {/* --- Notion-like Banner Section --- */}
      <div className="relative w-full h-[30vh] min-h-[200px] group shrink-0 bg-muted/30">
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
          <div className="w-full h-full bg-linear-to-r from-muted to-muted/50" />
        )}

        {/* Dark Overlay Gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Top Navigation Overlay (Breadcrumbs & Actions) */}
        <div className="absolute top-0 left-0 w-full p-4 z-10 flex justify-between items-start">
          <div className="flex items-center gap-2 text-white/90">
            <SidebarTrigger
              size="lg"
              className="text-white hover:bg-white/20 hover:text-white"
            />

            {/* Breadcrumb - Custom styling for overlay visibility */}
            {folder.parentId && parentfolder && (
              <Breadcrumb>
                <BreadcrumbList className="text-white/80 sm:text-white/90">
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link
                        href={`/folders/${parentfolder._id}`}
                        className="flex items-center gap-2 hover:text-white transition-colors"
                      >
                        <Folder className="h-4 w-4" />
                        <span>{parentfolder.name}</span>
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="text-white/50">
                    <SlashIcon />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="flex items-center gap-2 text-white font-medium">
                      <Folder className="h-4 w-4" />
                      {folder.name}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleUploadBanner}
            />

            {/* Public/Private Toggle */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMakepublic}
              className="bg-black/40 hover:bg-black/60 text-white border border-white/10 backdrop-blur-sm"
            >
              <Globe className="h-4 w-4 mr-2" />
              {folder.isPublic ? "Public" : "Private"}
            </Button>
          </div>
        </div>

        <div className="space-y-2 absolute bottom-4 left-4 ">
          <h1 className="text-4xl font-bold tracking-tight">{folder.name}</h1>
          {folder.description && (
            <p className="text-muted-foreground text-lg">
              {folder.description}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              <Folder className="h-4 w-4 " />
              {subfoldersCount}
              <p className="text-xs text-muted-foreground">folders</p>
            </Badge>
            <Badge variant="outline">
              <Notebook className="h-4 w-4" />
              {notes.length}
              <p className="text-xs text-muted-foreground">notes</p>
            </Badge>
            <Badge variant="outline">
              <CreditCard className="h-4 w-4" />
              {flashcards?.length || 0}
              <p className="text-xs text-muted-foreground">cards</p>
            </Badge>
            <Badge variant="outline">
              <File className="h-4 w-4" />
              {files.length}
              <p className="text-xs text-muted-foreground">uploaded</p>
            </Badge>
          </div>
        </div>

        {/* Change Cover Button - Appears on Hover */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="secondary"
            size="sm"
            onClick={triggerFileInput}
            disabled={isUploadingBanner}
            className="bg-black/50 hover:bg-black/70 text-white border-none backdrop-blur-sm shadow-sm"
          >
            {isUploadingBanner ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ImageIcon className="h-4 w-4 mr-2" />
            )}
            {geturl ? "Change Cover" : "Add Cover"}
          </Button>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="flex-1 space-y-6 p-6 -mt-4 relative z-0">
        {/* Flashcard Stats - Only show if there are flashcards */}
        {flashcards && flashcards.length > 0 && (
          <div className="space-y-6">
            {/* Due Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Due Today */}
              <Card
                className={
                  stats.dueToday > 0
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                    : ""
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Due Today
                    </CardTitle>
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {stats.dueToday}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.dueToday === 0
                      ? "All caught up!"
                      : "Ready to review"}
                  </p>
                </CardContent>
              </Card>

              {/* Due This Week */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      This Week
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.duethisweek}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cards to review
                  </p>
                </CardContent>
              </Card>

              {/* Mastered Cards */}
              <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Mastered
                    </CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {stats.masteredCards}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(masteryPercentage)}% of total
                  </p>
                </CardContent>
              </Card>

              {/* New Cards */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      New Cards
                    </CardTitle>
                    <Zap className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {stats.newcards}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Never reviewed
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Progress & Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mastery Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Mastery Progress
                  </CardTitle>
                  <CardDescription>
                    {stats.masteredCards} of {stats.totalCards} cards mastered
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">
                        {Math.round(masteryPercentage)}%
                      </span>
                    </div>
                    <Progress value={masteryPercentage} className="h-2" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-muted rounded">
                      <div className="text-lg font-bold">
                        {stats.masteredCards}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Mastered
                      </div>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <div className="text-lg font-bold">
                        {stats.totalCards -
                          stats.masteredCards -
                          stats.newcards}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Learning
                      </div>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <div className="text-lg font-bold">{stats.newcards}</div>
                      <div className="text-xs text-muted-foreground">New</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance
                  </CardTitle>
                  <CardDescription>Your study statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Success Rate
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        {Math.round(stats.successRate)}%
                      </span>
                    </div>
                    <Progress value={stats.successRate} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Total Reviews
                      </div>
                      <div className="text-2xl font-bold">
                        {stats.totalReviews}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Avg Ease
                      </div>
                      <div className="text-2xl font-bold">
                        {stats.averageEase.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Study Recommendation */}
            {stats.dueToday > 0 && (
              <Card className="border-primary bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                      <Brain className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Ready to Study?</h3>
                      <p className="text-sm text-muted-foreground">
                        You have {stats.dueToday} card
                        {stats.dueToday > 1 ? "s" : ""} waiting for review. Keep
                        up the momentum!
                      </p>
                    </div>
                    <Button>Start Review</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Caught Up Message */}
            {stats.dueToday === 0 && stats.totalCards > 0 && (
              <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500">
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-700 dark:text-green-400">
                        All Caught Up!
                      </h3>
                      <p className="text-sm text-green-600 dark:text-green-500">
                        Great work! No cards due for review right now. Next
                        review: {stats.duethisweek - stats.dueToday} card
                        {stats.duethisweek - stats.dueToday !== 1
                          ? "s"
                          : ""}{" "}
                        this week.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State - No Flashcards */}
        {(!flashcards || flashcards.length === 0) && (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  No Flashcards Yet
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  Create your first flashcard set to start studying and tracking
                  your progress.
                </p>
                <Button>Create Flashcard Set</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
