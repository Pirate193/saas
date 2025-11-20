"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton";
import { BookmarkCheck } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { SavedFolderTreeItem } from "./saved-folder-tree-item";

export default function NavSaved() {
  const savedFolders = useQuery(api.saving.getSavedFolderDetails);

  if (savedFolders === undefined) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>
          <div className="flex items-center gap-2">
            <BookmarkCheck className="h-4 w-4" />
            Saved
          </div>
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="space-y-2 p-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // Filter to only root saved folders (those without parents or whose parents aren't in our saved list)
  const savedFolderIds = new Set(savedFolders.map((f) => f._id));
  const rootSavedFolders = savedFolders.filter((folder) => {
    if (!folder.parentId) return true;
    return !savedFolderIds.has(folder.parentId as any);
  });

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center gap-2">
        <BookmarkCheck className="h-4 w-4" />
        Saved
      </SidebarGroupLabel>
      <SidebarGroupContent>
        {rootSavedFolders.length === 0 ? (
          <p className="text-xs text-muted-foreground px-2 py-4">
            No saved folders yet
          </p>
        ) : (
          <div className="space-y-0.5">
            {rootSavedFolders.map((folder) => (
              <SavedFolderTreeItem key={folder._id} folder={folder} level={0} />
            ))}
          </div>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
