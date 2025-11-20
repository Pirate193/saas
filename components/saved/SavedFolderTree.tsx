"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  File as FileIcon,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface SavedFolderData {
  _id: Id<"folders">;
  name: string;
  parentId?: string;
}

interface SavedFolderTreeItemProps {
  folder: SavedFolderData;
  level: number;
  rootSavedId: string;
}

export function SavedFolderTreeItem({
  folder,
  level,
  rootSavedId,
}: SavedFolderTreeItemProps) {
  const router = useRouter();
  const params = useParams();
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

  const isActive = params.savedId === folder._id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleFolderClick = () => {
    if (folder._id === rootSavedId) {
      router.push(`/saved/${rootSavedId}`);
    } else {
      router.push(`/saved/${folder._id}`);
    }
  };

  return (
    <div>
      {/* Folder Row */}
      <div
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none",
          isActive &&
            "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleFolderClick}
      >
        {/* Chevron Toggle */}
        <button
          onClick={handleToggle}
          className={cn(
            "shrink-0 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-transform",
            !hasChildren && "invisible"
          )}
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-transform text-gray-400",
              isExpanded && "rotate-90"
            )}
          />
        </button>

        {/* Folder Icon */}
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-yellow-500" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-yellow-500" />
        )}

        <span className="truncate flex-1">{folder.name}</span>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-0.5">
          {/* Render Subfolders (Recursive) */}
          {childFolders?.map((child) => (
            <SavedFolderTreeItem
              key={child._id}
              folder={child}
              level={level + 1}
              rootSavedId={rootSavedId}
            />
          ))}

          {/* Render Notes */}
          {notes?.map((note) => (
            <div
              key={note._id}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 select-none",
                params.noteId === note._id &&
                  "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium"
              )}
              style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/saved/${rootSavedId}/note/${note._id}`);
              }}
            >
              <FileText className="h-4 w-4 shrink-0 opacity-70" />
              <span className="truncate">{note.title}</span>
            </div>
          ))}

          {/* Render Files */}
          {files?.map((file) => (
            <div
              key={file._id}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 select-none"
              style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/saved/${rootSavedId}/file/${file._id}`);
              }}
            >
              <FileIcon className="h-4 w-4 shrink-0 opacity-70" />
              <span className="truncate">{file.fileName}</span>
            </div>
          ))}

          {/* Render Flashcards Link */}
          {flashcards && flashcards.length > 0 && (
            <div
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 select-none"
              style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/saved/${rootSavedId}/flashcards`);
              }}
            >
              <CreditCard className="h-4 w-4 shrink-0 opacity-70" />
              <span>Flashcards ({flashcards.length})</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
