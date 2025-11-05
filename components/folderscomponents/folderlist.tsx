'use client'

import { api } from "@/convex/_generated/api"
import { useQuery } from "convex/react"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../ui/empty";
import { Button } from "../ui/button";
import { FolderOpen } from "lucide-react"; // Import FolderOpen
import { useState } from "react";
import { Card, CardContent } from "../ui/card"; // Import Card/CardContent
import { Id } from "@/convex/_generated/dataModel";
import CreateFolder from "./create-folder";
import { useRouter } from "next/navigation";
// Import the new components
import { FolderCard, FolderCardSkeleton } from "./FolderCard";

function FolderListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <FolderCardSkeleton key={i} />
      ))}
    </div>
  );
}

export const Folderlist = () => {
    const router = useRouter();
    const folders = useQuery(api.folders.fetchFolders);
    
    const [opencreatefolderdialog,setOpenCreateFolderDialog]=useState(false);

    if(folders === undefined){
        return <FolderListSkeleton />
    }
    
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
                      <Button onClick={()=>setOpenCreateFolderDialog(true)} >Create Folder</Button>
                    </div>
                  </EmptyContent>
                </Empty>
        ):(
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 
                 {/* This is the "Create Folder" card */}
                 <Card 
                    className="border-2 border-dotted  transition-all cursor-pointer hover:text-myprimary hover:border-myprimary min-h-[220px]" // Added min-h to match card height
                    onClick={()=>setOpenCreateFolderDialog(true)}  
                 >
                    <CardContent className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground hover:text-myprimary">
                        <FolderOpen className="h-8 w-8 shrink-0" />
                        <span>Create Folder</span>
                    </CardContent>
                 </Card>

                 {/* Map over folders and use the new FolderCard component */}
                  {folders.map((folder) => (
                    <FolderCard 
                      key={folder._id} 
                      folder={folder} 
                      allFolders={folders} // Pass all folders for subfolder counting
                    />
                  ))}
            </div>
        )}
        <CreateFolder open={opencreatefolderdialog} onOpenChange={setOpenCreateFolderDialog} />
    </div>
  )
}