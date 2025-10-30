'use client';
import { Plus } from "lucide-react";
import CreateFolder from "../folderscomponents/create-folder";
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from "../ui/sidebar";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FolderTreeItem } from "./folder-tree-item";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";

const Navfolders = () => {
  const folders = useQuery(api.folders.fetchFolders);
  const notes = useQuery(api.notes.fetchNotes);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);

  if (!folders || !notes) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Folders</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="text-sm text-muted-foreground px-2 py-4">
            Loading...
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // Build folder tree structure
  const buildFolderTree = (parentId?: Id<"folders"> | string) => {
    return folders
      .filter((folder) => folder.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Count items in each folder
  const getFolderItemCounts = (folderId: Id<"folders"> | string) => {
    const folderNotes = notes.filter((note) => note.folderId === folderId);
    const subfolders = folders.filter((f) => f.parentId === folderId);
    
    return {
      notes: folderNotes.length,
      subfolders: subfolders.length,
    };
  };

  const rootFolders = buildFolderTree();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center justify-between group/label">
        Folders
    
            <button className="opacity-0 group-hover/label:opacity-60 hover:opacity-100! transition-opacity" onClick={() => setIsCreateFolderOpen(true)}>
              <Plus className="h-4 w-4" />
            </button>
         <CreateFolder 
         open={isCreateFolderOpen}
         onOpenChange={setIsCreateFolderOpen} />
      </SidebarGroupLabel>
      <SidebarGroupContent>
        {rootFolders.length === 0 ? (
          <div className="text-sm text-muted-foreground px-2 py-4">
            No folders yet. Create one to get started!
          </div>
        ) : (
          <div className="space-y-0.5">
            {rootFolders.map((folder) => (
              <FolderTreeItem
                key={folder._id}
                folder={folder}
                allFolders={folders}
                allNotes={notes}
                level={0}
                buildFolderTree={buildFolderTree}
                getFolderItemCounts={getFolderItemCounts}
              />
            ))}
          </div>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default Navfolders;