
import { AiTriggerButton } from '@/components/ai/aiModaltrigger';
import Notecomponent from '@/components/notescomponents/noteComponent';
import Notesheader from '@/components/notescomponents/notesheader';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { fetchQuery } from 'convex/nextjs';
import React from 'react'

const Notespage = async ({params}:{params:Promise<{noteId:string}>}) => {
    const {noteId} = await params;
    const note = await  fetchQuery(api.notes.getNoteId,{noteId:noteId as Id<'notes'>})
  return (
    <div className="h-full flex flex-col dark:bg-[#1f1f1f] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden  ">
       <Notesheader noteId={noteId as Id<'notes'>} />
       
       <Notecomponent noteId={noteId as Id<'notes'> } />
        {note && (
            <div className="absolute bottom-2 right-2 flex items-center gap-2 text-xs text-muted-foreground justify-end pt-2 ">
          <span>
            Last edited: {new Date(note.updatedAt).toLocaleString()}
          </span>
        </div>
        )}
            <AiTriggerButton context={{type:'note',id:noteId as Id<'notes'>,name:'note'}} />
        
    </div>
  )
}

export default Notespage