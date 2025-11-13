
import { AiTriggerButton } from '@/components/ai/aiModaltrigger';
import Notecomponent from '@/components/notescomponents/noteComponent';
import Notesheader from '@/components/notescomponents/notesheader';
import { Id } from '@/convex/_generated/dataModel';
import React from 'react'

const Notespage = async ({params}:{params:Promise<{noteId:string}>}) => {
    const {noteId} = await params;
  return (
    <div className="h-full flex flex-col dark:bg-[#1f1f1f] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden  ">
       <Notesheader noteId={noteId as Id<'notes'>} />
       
       <Notecomponent noteId={noteId as Id<'notes'> } />
        <AiTriggerButton context={{type:'note',id:noteId as Id<'notes'>,name:'note'}} />
    </div>
  )
}

export default Notespage