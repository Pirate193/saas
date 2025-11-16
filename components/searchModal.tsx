'use client'
import { useState } from 'react'
import { Doc } from '@/convex/_generated/dataModel'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'

import { File, Folder, Notebook, Search } from 'lucide-react'
import { ScrollArea } from './ui/scroll-area'
import { Label } from './ui/label'
import { useRouter } from 'next/navigation'
interface SearchModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}
export const SearchModal = ({open,onOpenChange}:SearchModalProps) => {
    const router = useRouter();
    const folders = useQuery(api.folders.fetchFolders)
    const notes = useQuery(api.notes.fetchNotes)
    const files = useQuery(api.files.fetchallfiles)
    const [search,setSearch]=useState('')

    const filteredFolders = folders?.filter((folder)=>folder.name.toLowerCase().includes(search.toLowerCase().trim()))
    const filteredNotes = notes?.filter((note)=>note.title.toLowerCase().includes(search.toLowerCase().trim()))
    const filteredFiles = files?.filter((file)=>file.fileName.toLowerCase().includes(search.toLowerCase().trim()))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
       
       <DialogContent className=' w-full flex flex-col  max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-hidden  '>
        
         <DialogHeader>
        <DialogTitle>Search</DialogTitle>
       </DialogHeader>
       <div className='my-2 flex items-center gap-2 ' >
        <Search className='h-4 w-4' />
        <Input 
        value={search}
        onChange={(e)=>setSearch(e.target.value)}
        placeholder='Search...'
        className=''
        />
       </div>
       <ScrollArea className='flex-1 overflow-y-auto pr-4 scrollbar-hidden'>
       <div className='space-y-2'>
            <Label>Folders:</Label>
            {filteredFolders?.map((folder)=>(
                <div key={folder._id} onClick={()=>router.push(`/folders/${folder._id}`)} className='flex items-center gap-2 hover:bg-primary/50 p-2 rounded-2xl cursor-pointer' >
                  <Folder className='h-4 w-4' />
                  <span className='truncate' >{folder.name}</span>
                </div>
            ))}
            {filteredFolders?.length === 0 && <p>No folders found</p>}
            <Label>Notes:</Label>
            {filteredNotes?.map((note)=>(
                <div key={note._id} onClick={()=>router.push(`/note/${note._id}`)} className='flex items-center gap-2 hover:bg-primary/50 p-2 rounded-2xl cursor-pointer' >
                    <Notebook className='h-4 w-4' />
                    <span className='truncate' >{note.title}</span>
                </div>
            ))}
            {filteredNotes?.length === 0 && <p>No notes found</p>}
            <Label>Files:</Label>
            {filteredFiles?.map((file)=>(
                <div key={file._id} onClick={()=>router.push(`/files/${file._id}`)} className='flex items-center gap-2 hover:bg-primary/50 p-2 rounded-2xl cursor-pointer' >
                    <File className='h-4 w-4' />
                    <span className='truncate' >{file.fileName}</span>
                </div>
            )) }
            {filteredFiles?.length === 0 && <p>No files found</p>}
            </div>
            </ScrollArea>
       
       </DialogContent>
    </Dialog>
  )
}
