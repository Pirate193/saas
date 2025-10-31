'use client';

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  Plus,
  MoreHorizontal,
  FileText,
  CreditCard,
  File as FileIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreateFolder from "../folderscomponents/create-folder";
import DeleteDialog from "../DeleteDialog";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import UpdateDialog from "../folderscomponents/update-folder";
import NoteItem from "../notescomponents/noteItem";
import Uploadfile from "../filescomponents/uploadfile";

// ============================================
// TYPE DEFINITIONS
// ============================================
// These types match what Convex returns from the database

type FolderData = {
  _id: Id<"folders">;           // Unique folder ID from Convex
  _creationTime: number;         // Timestamp when folder was created
  name: string;                  // Folder name displayed to user
  parentId?: string | Id<"folders">; // ID of parent folder (undefined = root folder)
  userId: string;                // Owner of this folder
  description?: string;          // Optional folder description
};

type NoteData = {
  _id: Id<"notes">;
  _creationTime: number;
  userId: string;
  folderId?: Id<"folders">;      // Which folder this note belongs to
  title: string;
  content: string;
  updatedAt: number;
};

// ============================================
// COMPONENT PROPS
// ============================================
interface FolderTreeItemProps {
  folder: FolderData;                        // The current folder to render
  allFolders: FolderData[];                  // All folders (needed to find children)
  allNotes: NoteData[];                      // All notes (needed to count items)
  level: number;                             // Nesting depth (0 = root, 1 = first level, etc.)
  buildFolderTree: (parentId?: Id<"folders"> | string) => FolderData[];  // Function to get child folders
  getFolderItemCounts: (folderId: Id<"folders"> | string) => { notes: number; subfolders: number };  // Count items in folder
}

// ============================================
// MAIN COMPONENT
// ============================================
/**
 * FolderTreeItem - A recursive component that renders a folder and all its children
 * 
 * How it works:
 * 1. Renders a single folder with expand/collapse arrow
 * 2. When expanded, recursively renders child folders (nested)
 * 3. Shows count of notes/subfolders in the folder
 * 4. Provides "+" button to create new items (folder, note, flashcard, file)
 * 5. Provides "..." menu for folder actions (rename, move, delete)
 * 
 * Key features:
 * - Collapsible tree structure (like Notion/VSCode)
 * - Visual indentation based on nesting level
 * - Hover states and active state highlighting
 * - Action buttons appear on hover
 */
export function FolderTreeItem({
  folder,
  allFolders,
  allNotes,
  level,
  buildFolderTree,
  getFolderItemCounts,
}: FolderTreeItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [isExpanded, setIsExpanded] = useState(false);  // Controls if folder is expanded/collapsed

  const deleteFolder = useMutation(api.folders.deleteFolder);
  const fetchNotesInFolder = useQuery(api.notes.fetchNotesInFolder,{folderId:folder._id});
  // ============================================
  // COMPUTED VALUES
  // ============================================
  const childFolders = buildFolderTree(folder._id);     // Get all direct child folders
  const hasChildren = childFolders.length > 0 || (fetchNotesInFolder && fetchNotesInFolder.length > 0) ;          // Does this folder have subfolders?
  const counts = getFolderItemCounts(folder._id);       // Count notes and subfolders
  const isActive = pathname === `/folders/${folder._id}`; // Is user currently viewing this folder?
  const createNote = useMutation(api.notes.createNote)


  const [isCreateSubfolderOpen, setIsCreateSubfolderOpen] = useState(false); //subfolder state

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false); //delete dialog state
  const [UpdateDialogOpen, setUpdateDialogOpen] = useState(false); //update dialog state
  const [openUploadDialog,setOpenUploadDialog] = useState(false); //upload dialog state
  // ============================================
  // EVENT HANDLERS
  // ============================================
  
  /**
   * Navigate to the folder view when folder is clicked
   */
  const handleFolderClick = () => {
    router.push(`/folders/${folder._id}`);
  };

  /**
   * Toggle expand/collapse state
   * stopPropagation prevents triggering handleFolderClick
   */
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  /**
   * Handler for creating a new subfolder
   * TODO: Implement with Convex mutation
   */
  const handleCreateSubfolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Create subfolder in:", folder._id);
    // TODO: Call Convex mutation: api.folders.create({ name: "New Folder", parentId: folder._id })
  };

  /**
   * Handler for creating a new note
   * TODO: Implement with Convex mutation
   */
  const handleCreateNote = async (e: React.MouseEvent) => {
    e.stopPropagation();
     await createNote({ title: "New Note", folderId: folder._id })
    // TODO: Call Convex mutation: api.notes.create({ title: "New Note", folderId: folder._id })
    // Then navigate to the new note
  };

  /**
   * Handler for creating a new flashcard
   * TODO: Implement with Convex mutation
   */
  const handleCreateFlashcard = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Create flashcard in:", folder._id);
    // TODO: Call Convex mutation: api.flashcards.create({ folderId: folder._id })
  };

  /**
   * Handler for uploading a file
   * TODO: Implement file upload with Convex storage
   */
  const handleUploadFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Upload file to:", folder._id);
    // TODO: Trigger file input dialog, then upload to Convex storage
    // Call: api.files.create({ fileName, fileType, storageId, folderId: folder._id })
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div>
      {/* ============================================
          FOLDER ROW (Main clickable area)
          ============================================ */}
      <div
        className={cn(
          "group/item flex items-center gap-1 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-accent transition-colors",
          isActive && "bg-accent font-medium"  // Highlight if this folder is currently open
        )}
        // Dynamic padding based on nesting level (creates the tree indent effect)
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleFolderClick}
      >
        {/* Expand/Collapse Chevron Button */}
        <button
          onClick={handleToggle}
          className={cn(
            "shrink-0 rounded-sm hover:bg-accent-foreground/10 p-0.5 transition-transform",
            !hasChildren && "invisible"  // Hide chevron if no children
          )}
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-90"  // Rotate 90° when expanded
            )}
          />
        </button>

        {/* Folder Icon (changes when expanded) */}
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-blue-500" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-blue-500" />
        )}

        {/* Folder Name */}
        <span className="flex-1 truncate">{folder.name}</span>

        {/* Item Count Badge (shows total notes + subfolders) */}
        {(counts.notes > 0 || counts.subfolders > 0) && (
          <span className="text-xs text-muted-foreground">
            {counts.notes + counts.subfolders}
          </span>
        )}

        {/* ============================================
            ACTION BUTTONS (appear on hover)
            ============================================ */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
          
          {/* "+" Button - Opens dropdown to create new items */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                
             <DropdownMenuItem onClick={()=> setIsCreateSubfolderOpen(true)}>
               
                <Folder className="h-4 w-4 mr-2" />
                New Folder
              </DropdownMenuItem>
               
              <DropdownMenuItem onClick={handleCreateNote}>
                <FileText className="h-4 w-4 mr-2" />
                New Note
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCreateFlashcard}>
                <CreditCard className="h-4 w-4 mr-2" />
                New Flashcard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={()=>setOpenUploadDialog(true)}>
                <FileIcon className="h-4 w-4 mr-2" />
                Upload File
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* "..." Button - Folder management actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setUpdateDialogOpen(true)}>
                Rename
                {/* TODO: Open inline input or dialog to rename folder */}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log("Move")}>
                Move to...
                {/* TODO: Open folder picker to move this folder to another parent */}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log("Duplicate")}>
                Duplicate
                {/* TODO: Create a copy of this folder and all its contents */}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setOpenDeleteDialog(true)}
              >
                Delete
                {/* TODO: Confirm deletion, then call api.folders.delete */}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ============================================
          EXPANDED CHILDREN (only shown when expanded)
          ============================================ */}
      {isExpanded && (
        <div className="space-y-0.5">
          
          {/* Recursively render child folders */}
          {childFolders.map((childFolder: FolderData) => (
            <FolderTreeItem
              key={childFolder._id}
              folder={childFolder}
              allFolders={allFolders}
              allNotes={allNotes}
              level={level + 1}  // Increment level for deeper indentation
              buildFolderTree={buildFolderTree}
              getFolderItemCounts={getFolderItemCounts}
            />
          ))}

          {/* Notes Summary Link (if folder has notes) */}
          {counts.notes > 0 && (
            fetchNotesInFolder?.map((note)=>(
              <div key={note._id}
              className="" 
              style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
               >
              <NoteItem noteId={note._id} title={note.title} folderId={note.folderId}  />
              </div>
            ))
          )}

          {/* Flashcards Link (placeholder - shows all flashcards in folder) */}
          {/* <div
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 cursor-pointer transition-colors"
            style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
            onClick={() => router.push(`/folders/${folder._id}/flashcards`)}
          >
            <CreditCard className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">Flashcards</span>
          </div> */}

          {/* Files Link (placeholder - shows all uploaded files in folder) */}
          {/* <div
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 cursor-pointer transition-colors"
            style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
            onClick={() => router.push(`/folders/${folder._id}/files`)}
          >
            <FileIcon className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">Files</span>
          </div> */}
        </div>
      )}
      <CreateFolder open={isCreateSubfolderOpen} onOpenChange={setIsCreateSubfolderOpen} parentId={folder._id} />
      <DeleteDialog
      open={openDeleteDialog}
      onOpenChange={setOpenDeleteDialog}
      title="Delete Folder"
      description={`Are you sure you want to delete ${folder.name} This action cannot be undone `}
      itemName={folder.name}
      onConfirm={()=>{
        deleteFolder({folderId:folder._id})
      }}
      />
      <UpdateDialog 
      open={UpdateDialogOpen}
      onOpenChange={setUpdateDialogOpen}
      folderId={folder._id}
      />
      <Uploadfile
      open={openUploadDialog}
      onclose={setOpenUploadDialog}
      folderId={folder._id}
      />
    </div>
  );
}