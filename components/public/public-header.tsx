"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ArrowLeft, Copy, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface PublicHeaderProps {
  folderId: Id<"folders">;
}

const PublicHeader = ({ folderId }: PublicHeaderProps) => {
  const folder = useQuery(api.public.getPublicFolderById, { folderId });
  const cloneFolder = useMutation(api.clone.cloneFolder);
  const geturl = useQuery(
    api.folders.getUrl,
    folder?.bannerId ? { storageId: folder.bannerId } : "skip"
  );

  if (!folder) {
    return (
      <div className="w-full h-[30vh] min-h-[200px] p-4">
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    );
  }
  const handleClone = async () => {
    try {
      await cloneFolder({ folderId: folderId });
      toast.success("Folder cloned successfully");
    } catch (error) {
      toast.error("Failed to clone folder");
    }
  };
  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="relative w-full h-[20vh] min-h-[200px] group shrink-0 bg-muted/30">
      {/* --- 1. Banner Image --- */}
      {geturl ? (
        <Image
          src={geturl}
          alt={folder.name}
          fill
          className="object-cover"
          priority
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-muted to-muted/50" />
      )}

      {/* --- 2. Dark Overlay for Text Readability --- */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

      {/* --- 3. Top Navigation (Trigger & Public Badge) --- */}
      <div className="absolute top-0 left-0 w-full p-4 z-10 flex justify-between items-start">
        {/* Left: Sidebar Trigger */}
        <div className="flex items-center">
          <SidebarTrigger
            size="lg"
            className="text-white hover:bg-white/20 hover:text-white transition-colors"
          />
          {folder.parentId && (
            <Button onClick={handleBack}>
              <ArrowLeft />
            </Button>
          )}
        </div>

        {/* Right: Hardcoded Public Badge */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={handleClone}>
                <Copy className="h-4 w-4" />
                Clone
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clone folder</p>
            </TooltipContent>
          </Tooltip>
          <Badge
            variant="secondary"
            className="bg-black/40 hover:bg-black/60 text-white border border-white/20 backdrop-blur-sm gap-1.5 px-3 py-1"
          >
            <Globe className="h-3.5 w-3.5" />
            Public
          </Badge>
        </div>
      </div>

      {/* --- 4. Folder Name (Bottom Overlay) --- */}
      <div className="absolute bottom-0 left-0 w-full p-6 z-10">
        <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-md">
          {folder.name}
        </h1>
        {folder.description && (
          <p className="text-white/90 mt-2 text-lg max-w-2xl drop-shadow-sm line-clamp-2">
            {folder.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default PublicHeader;
