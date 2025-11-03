'use client'

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel"
import { useMutation, useQuery } from "convex/react";
import { SidebarTrigger } from "../ui/sidebar";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link"
import { Copy, Download, Folder, MoreHorizontal, Pencil, SlashIcon, Trash } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { useState } from "react";
import UpdateTitle from "./update-title";
import DeleteDialog from "../DeleteDialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
interface Props{
    noteId:Id<'notes'>;
}

const Notesheader = ({noteId}:Props) => {
    const router = useRouter();
    const note = useQuery(api.notes.getNoteId,{noteId:noteId})
    const folder = useQuery(api.folders.getFolderById,{folderId:note?.folderId as Id<'folders'> })
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openRenameDialog, setOpenRenameDialog] = useState(false);
    const deletenote = useMutation(api.notes.deleteNote);

    if(!note || !folder){
        return(
            <div>
                <Skeleton className="h-10 w-10" />
            </div>
        )
    }

    const handledelete = async()=>{
          try{
            await deletenote({noteId:noteId});
            toast.success("Note deleted successfully");
            router.push(`/folders/${folder._id}`);
          }catch(error){
            console.log(error);
            toast.error("Failed to delete note");
          }
    }
   const handleCopy = () => {
    navigator.clipboard.writeText(note.content?.toString() || '');
    toast.success('Note copied to clipboard');
  }
  return (
    <>
    <div className="p-4 flex items-center justify-between gap-2" >
        {/*breadcrumb  */}
      <div>
        <div className="flex items-center gap-2  " >
            <SidebarTrigger />
        <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem  >
          <BreadcrumbLink asChild >
            <Link href={`/folders/${folder._id}`} className="flex items-center gap-2" >
            <Folder className="h-4 w-4" />
           <span>  {folder.name} </span> </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <SlashIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>{note.title}</BreadcrumbPage>
        </BreadcrumbItem>
        </BreadcrumbList>
        </Breadcrumb>
        </div>
      </div>
       <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild >
                <Button variant="outline" aria-label="Open menu" size="icon-sm" >
                <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" >
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
            <DropdownMenuItem>
                <Download className=" h-4 w-4"/>
                Export 
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopy} >
                <Copy className=" h-4 w-4"/>
                Copy
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
      description={`Are you sure you want to delete ${note.title} This action cannot be undone.`}
      itemName={note.title}
      onConfirm={handledelete}
      />
    </>
  )
}

export default Notesheader