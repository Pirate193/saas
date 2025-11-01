'use client'

import { api } from "@/convex/_generated/api"
import { useMutation, useQuery } from "convex/react"
import { Skeleton } from "../ui/skeleton";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../ui/empty";
import { Button } from "../ui/button";
import { Calendar, Edit, Folder, FolderOpen, Link, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Id } from "@/convex/_generated/dataModel";
import CreateFolder from "./create-folder";
import { formatDistanceToNow } from 'date-fns';
import UpdateDialog from "./update-folder";
import DeleteDialog from "../DeleteDialog";
import { useRouter } from "next/navigation";

function FolderSkeleton() {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[125px] w-[250px] rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
}

export const Folderlist = () => {
    const router = useRouter();
    const folders = useQuery(api.folders.fetchFolders);
    const deletefolder = useMutation(api.folders.deleteFolder)
    const [opencreatefolderdialog,setOpenCreateFolderDialog]=useState(false);
    const [openDeleteDialog,setOpenDeleteDialog]=useState(false);
    const [openUpdateDialog,setOpenUpdateDialog]=useState(false);
    const [foldertodelete,setFolderTodelete]=useState<Id<'folders'> | null>(null);
    const [folderToUpdate,setFolderToUpdate]=useState('');

    if(folders === undefined){
        return(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <FolderSkeleton key={i} />
        ))}
      </div>
        )
    }
    const handledelete = async ()=>{
        if(!foldertodelete) return;
        await deletefolder({folderId:foldertodelete})
        setOpenDeleteDialog(false)
        setFolderTodelete(null)
    }
    const handleCardClick = (folderId: Id<"folders">) => {
    router.push(`/folders/${folderId}`);
  };
  return (
    <div className="flex-1" >
        {folders.length === 0 ?(
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FolderOpen />
                    </EmptyMedia>
                    <EmptyTitle>No Folders Yet</EmptyTitle>
                    <EmptyDescription>
                      You haven&apos;t created any folders yet. Get started by creating
                      your first folder.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <div className="flex ">
                      <Button onClick={()=>setOpenCreateFolderDialog(true)} >Create Flashcard</Button>
                    </div>
                  </EmptyContent>
                </Empty>
        ):(
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
         <Card className="border-2 border-dotted hover:bg-[#e3ebdd] transition-all  cursor-pointer hover:text-myprimary  hover:border-myprimary " onClick={()=>setOpenCreateFolderDialog(true)}  >
            <CardContent className="flex flex-1 items-end" >
                <div  >
                    <FolderOpen className="h-5 w-5 shrink-0" />
                 Create Folder
                </div>
            </CardContent>
         </Card>
          {folders.map((folder) => (
            <Card
              key={folder._id}
              className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden"
              onClick={() => handleCardClick(folder._id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Folder className="h-5 w-5 shrink-0 text-myprimary" />
                    <CardTitle className="text-lg truncate">
                      {folder.name}
                    </CardTitle>
                  </div>

                  {/* Dropdown Menu */}
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
                          setFolderToUpdate(folder._id);
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
                          setFolderTodelete(folder._id);
                          setOpenDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Description */}
                {folder.description && (
                  <CardDescription className="text-sm line-clamp-2 mt-2">
                    {folder.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                {/* Created date */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Created{" "}
                    {formatDistanceToNow(new Date(folder._creationTime), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                {/* Footer with items count and view link */}
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">0 items</span>
                  <span className="text-primary group-hover:underline font-medium">
                    View folder →
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}
        <CreateFolder open={opencreatefolderdialog} onOpenChange={setOpenCreateFolderDialog} />
        {folderToUpdate && (
        <UpdateDialog
          open={openUpdateDialog}
          onOpenChange={setOpenUpdateDialog}
          folderId={folderToUpdate as Id<"folders">}
        />
      )}
        <DeleteDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog} title="Delete folder" description={`Are you sure you want to delete this folder? This action cannot be undone. All items in this folder will also be deleted.`} itemName={`${foldertodelete}`}
        onConfirm={handledelete} />
    </div>
  )
}
