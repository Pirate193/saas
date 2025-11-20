"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  CreditCard,
  File as FileIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type SavedFolderData = {
  _id: Id<"folders">;
  _creationTime: number;
  name: string;
  parentId?: string | Id<"folders">;
  userId: string;
  description?: string;
};

interface SavedFolderTreeItemProps {
  folder: SavedFolderData;
  level: number;
}

export function SavedFolderTreeItem({
  folder,
  level,
}: SavedFolderTreeItemProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch content (Read-Only)
  const notes = useQuery(api.saving.getFolderNotes, {
    folderId: folder._id,
  });
  const files = useQuery(api.saving.getFolderFiles, {
    folderId: folder._id,
  });
  const flashcards = useQuery(api.saving.getFolderFlashcards, {
    folderId: folder._id,
  });

  // Fetch subfolders
  const childFolders = useQuery(api.saving.getFolderChildren, {
    parentId: folder._id,
  });

  const hasChildren =
    (childFolders && childFolders.length > 0) ||
    (notes && notes.length > 0) ||
    (files && files.length > 0) ||
    (flashcards && flashcards.length > 0);

  const isActive = pathname === `/saved/${folder._id}`;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleFolderClick = () => {
    router.push(`/saved/${folder._id}`);
  };

  const counts = {
    notes: notes?.length || 0,
    subfolders: childFolders?.length || 0,
    files: files?.length || 0,
    flashcards: flashcards?.length || 0,
  };

  return (
    <div>
      {/* Folder Row */}
      <div
        className={cn(
          "group/item flex items-center gap-1 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-accent transition-colors",
          isActive && "bg-[#e3ebdd] dark:bg-[#1c261f] font-medium"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleFolderClick}
      >
        {/* Expand/Collapse Chevron */}
        <button
          onClick={handleToggle}
          className={cn(
            "shrink-0 rounded-sm hover:bg-[#f4f2ea] dark:bg-[#1c261f] p-0.5 transition-transform",
            !hasChildren && "invisible"
          )}
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        </button>

        {/* Folder Icon */}
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-purple-500" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-purple-500" />
        )}

        {/* Folder Name */}
        <span className="flex-1 truncate">{folder.name}</span>

        {/* Item Count Badge */}
        {(counts.notes > 0 ||
          counts.subfolders > 0 ||
          counts.files > 0 ||
          counts.flashcards > 0) && (
          <span className="text-xs text-muted-foreground">
            {counts.notes +
              counts.subfolders +
              counts.files +
              counts.flashcards}
          </span>
        )}
      </div>

      {/* Expanded Children */}
      {isExpanded && (
        <div className="space-y-0.5">
          {/* Recursively render child folders */}
          {childFolders?.map((childFolder) => (
            <SavedFolderTreeItem
              key={childFolder._id}
              folder={childFolder}
              level={level + 1}
            />
          ))}

          {/* Notes */}
          {notes?.map((note) => (
            <div
              key={note._id}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 cursor-pointer transition-colors",
                pathname === `/saved/${folder._id}/note/${note._id}` &&
                  "bg-accent text-accent-foreground"
              )}
              style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/saved/${folder._id}/note/${note._id}`);
              }}
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{note.title}</span>
            </div>
          ))}

          {/* Flashcards Link */}
          {flashcards && flashcards.length > 0 && (
            <div
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 cursor-pointer transition-colors"
              style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/saved/${folder._id}/flashcards`);
              }}
            >
              <CreditCard className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">
                Flashcards ({flashcards.length})
              </span>
            </div>
          )}

          {/* Files */}
          {files?.map((file) => (
            <div
              key={file._id}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 cursor-pointer transition-colors"
              style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/saved/${folder._id}/file/${file._id}`);
              }}
            >
              <FileIcon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{file.fileName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
