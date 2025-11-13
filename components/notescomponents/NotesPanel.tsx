'use client';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAiStore } from '@/stores/aiStore'
import { useQuery } from 'convex/react';
import React from 'react'
import { Button } from '../ui/button';
import { Copy, X } from 'lucide-react';
import NoteComponent from './noteComponent';
import { blockNoteToPlainText } from '@/lib/convertmarkdowntoblock';
import { toast } from 'sonner';

export default function NotesPanel() {
    const {activeNoteId}=useAiStore();
    if (!activeNoteId) return null;
  return (
    <div className="flex flex-col h-full" >
       <NotePanelHeader noteId={activeNoteId}/>
       <div className="flex-1 overflow-y-auto scrollbar-hidden" >
            <NoteComponent noteId={activeNoteId} />
       </div>
    </div>
  )
}
function NotePanelHeader({ noteId }: { noteId: Id<'notes'>, }) {
  const note = useQuery(api.notes.getNoteId,{noteId:noteId})
  const {setIsNotePanelOpen}=useAiStore();
  if(!note){
    return null;
  }
   const handleCopy = async () => {
      if (!note.content) return;
      try {
        // 1. Await the async conversion
        const data = await blockNoteToPlainText(note.content);
        // 2. Write to clipboard
        navigator.clipboard.writeText(data);
        toast.success('Note copied to clipboard');
      } catch (error) {
        toast.error("Failed to copy note.");
      }
    }
  return (
    <div className="flex items-center justify-between p-2 border-b h-14">
      <span className="font-semibold text-sm truncate">
        {note ? note.title : 'Loading...'}
      </span>
      <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={()=>setIsNotePanelOpen(false)}>
        <X className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={handleCopy}>
        <Copy className="h-4 w-4" />
      </Button>
      </div>
    </div>
  );
}
