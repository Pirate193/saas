'use client';
import { Id } from "@/convex/_generated/dataModel";
import { useRouter, usePathname } from "next/navigation";
import { FileText, MoreHorizontal, Pencil, Trash } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useState } from "react";
import { Button } from "../ui/button";
import UpdateTitle from "./update-title";
import DeleteDialog from "../DeleteDialog";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

interface NoteItemProps {
  noteId: Id<"notes">;
  title: string;
  folderId?: Id<"folders">;
}
const NoteItem = ({ title, folderId, noteId }: NoteItemProps) => {
    const router = useRouter();
    const deletenote = useMutation(api.notes.deleteNote)
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openRenameDialog, setOpenRenameDialog] = useState(false);

    const handledelete = () => {
      try{
        deletenote({noteId: noteId});
        toast.success("Note deleted successfully");
      }catch(error){
        toast.error("Failed to delete note");
      }
    }
  return (
    <>
    <div
      className="group/item flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 cursor-pointer transition-colors"
      onClick={() => router.push(`/folders/${folderId}/note/${noteId}`)}
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{title}</span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreHorizontal className="h-4 w-4 cursor-pointer" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onSelect={() => setOpenRenameDialog(true)}>
                <Pencil className=" h-4 w-4" />
                Rename
                </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setOpenDeleteDialog(true)}
              className="text-destructive"
            >
                <Trash className=" h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
    </div>
    <UpdateTitle
      open={openRenameDialog}
        onOpenChange={setOpenRenameDialog}
        noteId={noteId}
      />
      <DeleteDialog 
      open={openDeleteDialog}
      onOpenChange={setOpenDeleteDialog}
      title="Delete Note"
      description={`Are you sure you want to delete ${title} This action cannot be undone.`}
      itemName={title}
      onConfirm={handledelete}
      />
    </>
  );
};

export default NoteItem;
