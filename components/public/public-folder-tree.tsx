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

// TYPES
interface PublicFolderData {
  _id: Id<"folders">;
  name: string;
  parentId?: string;
}

interface PublicFolderTreeItemProps {
  folder: PublicFolderData;
  level: number;
  rootPublicId: string;
}

export function PublicFolderTreeItem({
  folder,
  level,
  rootPublicId,
}: PublicFolderTreeItemProps) {
  const router = useRouter();
  const params = useParams();
  const [isExpanded, setIsExpanded] = useState(false);

  // --- 1. FETCH CONTENT (Read-Only) ---
  const notes = useQuery(api.public.getPublicFolderNotes, {
    folderId: folder._id,
  });
  const files = useQuery(api.public.getPublicFolderFiles, {
    folderId: folder._id,
  });
  const flashcards = useQuery(api.public.getPublicFolderFlashcards, {
    folderId: folder._id,
  });

  // --- 2. FETCH SUBFOLDERS (Recursive Lazy Load) ---
  const childFolders = useQuery(api.public.getPublicFolderChildren, {
    parentId: folder._id,
  });

  // Check if there is anything to show inside
  const hasChildren =
    (childFolders && childFolders.length > 0) ||
    (notes && notes.length > 0) ||
    (files && files.length > 0) ||
    (flashcards && flashcards.length > 0);

  const isActive = params.folderId === folder._id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleFolderClick = () => {
    // If clicking the root folder, go to the main public page
    if (folder._id === rootPublicId) {
      router.push(`/public/${rootPublicId}`);
    } else {
      router.push(`/public/${rootPublicId}/folder/${folder._id}`);
    }
  };

  return (
    <div>
      {/* --- FOLDER ROW --- */}
      <div
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted transition-colors select-none",
          isActive && "bg-muted text-blue-700 font-medium"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleFolderClick}
      >
        {/* Chevron Toggle */}
        <button
          onClick={handleToggle}
          className={cn(
            "shrink-0 p-0.5 hover:bg-muted rounded transition-transform",
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

      {/* --- EXPANDED CONTENT --- */}
      {isExpanded && (
        <div className="space-y-0.5">
          {/* Render Subfolders (Recursive) */}
          {childFolders?.map((child) => (
            <PublicFolderTreeItem
              key={child._id}
              folder={child}
              level={level + 1}
              rootPublicId={rootPublicId}
            />
          ))}

          {/* Render Notes */}
          {notes?.map((note) => (
            <div
              key={note._id}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted transition-colors  select-none",
                params.noteId === note._id &&
                  "bg-secondary text-secondary-foreground font-medium"
              )}
              style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/public/${rootPublicId}/note/${note._id}`);
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
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted transition-colors select-none"
              style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/public/${rootPublicId}/file/${file._id}`);
              }}
            >
              <FileIcon className="h-4 w-4 shrink-0 opacity-70" />
              <span className="truncate">{file.fileName}</span>
            </div>
          ))}

          {/* Render Flashcards (Single Link per Folder) */}
          {flashcards && flashcards.length > 0 && (
            <div
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted transition-colors select-none"
              style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/public/${rootPublicId}/flashcards`);
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
