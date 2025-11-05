'use client';

import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
  MoreVertical,
  Edit,
  Trash2,
  Folder,
  FileText,
  CreditCard,
  File as FileIcon,
  FolderTree, // Icon for subfolders
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from 'date-fns'; // For the date
import { Skeleton } from "../ui/skeleton";
import UpdateDialog from "./update-folder";
import DeleteDialog from "../DeleteDialog";

interface FolderCardProps {
  folder: Doc<"folders">;
  allFolders: Doc<"folders">[]; // Needed to count subfolders
}

/**
 * A small component to conditionally render item counts, matching the Figma design.
 */
function ItemCount({
  icon: Icon,
  label,
  count,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
}) {
  // Don't show the count if it's zero
  if (count === 0) return null; 

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      <span>
        {label}: {count}
      </span>
    </div>
  );
}

/**
 * Renders a loading skeleton for the folder card.
 */
export const FolderCardSkeleton = () => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Skeleton className="h-5 w-5 shrink-0" />
            <Skeleton className="h-5 w-3/4" />
          </div>
          <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 h-10">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="pt-3 border-t">
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * The main FolderCard component that fetches and displays folder data.
 */
export const FolderCard = ({ folder, allFolders }: FolderCardProps) => {
  const router = useRouter();
  
  // --- State for Dialogs ---
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  
  // --- Data Fetching for Counts ---
  // Each card will fetch the counts for its specific folderId
  const notes = useQuery(api.notes.fetchNotesInFolder, { folderId: folder._id });
  const files = useQuery(api.files.fetchfiles, { folderId: folder._id });
  const flashcards = useQuery(api.flashcards.fetchFlashcards, { folderId: folder._id });
  
  // Client-side calculation for subfolders (since we already have all folders)
  const subfoldersCount = allFolders.filter(f => f.parentId === folder._id).length;

  const deleteFolder = useMutation(api.folders.deleteFolder);

  // Show loading skeleton if any data is still loading
  const isLoading = notes === undefined || files === undefined || flashcards === undefined;

  const handleCardClick = () => {
    router.push(`/folders/${folder._id}`);
  };

  const handleDelete = async () => {
    if (!folder._id) return;
    await deleteFolder({ folderId: folder._id });
    setOpenDeleteDialog(false);
  };

  if (isLoading) {
    return <FolderCardSkeleton />;
  }

  return (
    <>
      <Card
        key={folder._id}
        className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden flex flex-col"
        onClick={handleCardClick}
      >
        {/* Card Header: Icon, Title, Dropdown */}
        <CardHeader className="">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Folder className="h-5 w-5 shrink-0 text-myprimary" />
              <CardTitle className="text-lg truncate" title={folder.name}>
                {folder.name}
              </CardTitle>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setOpenUpdateDialog(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={(e) => {
                    e.preventDefault();
                    setOpenDeleteDialog(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        {/* Card Content: Item Counts and Date */}
        {/* `flex-1` makes the content area grow to fill space */}
        <CardContent className="pt-0 space-y-4 flex flex-col flex-1">
          {/* `flex-1` makes the counts grid grow, pushing the date to the bottom */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 flex-1">
            <ItemCount icon={FileText} label="notes" count={notes?.length ?? 0} />
            <ItemCount icon={FileIcon} label="files" count={files?.length ?? 0} />
            <ItemCount icon={CreditCard} label="flashcards" count={flashcards?.length ?? 0} />
            <ItemCount icon={FolderTree} label="subfolders" count={subfoldersCount} />
          </div>

          {/* Footer with Created date */}
          <div className="text-sm text-muted-foreground pt-3 ">
            <span>
              {format(new Date(folder._creationTime), "MMM dd, yyyy")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs for this card */}
      <UpdateDialog
        open={openUpdateDialog}
        onOpenChange={setOpenUpdateDialog}
        folderId={folder._id}
      />
      <DeleteDialog
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        title="Delete folder"
        description={`Are you sure you want to delete "${folder.name}"? This action cannot be undone. All items in this folder will also be deleted.`}
        itemName={folder.name}
        onConfirm={handleDelete}
      />
    </>
  );
};