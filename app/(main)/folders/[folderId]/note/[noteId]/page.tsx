
import Notecomponent from '@/components/notescomponents/noteComponent';
import { Id } from '@/convex/_generated/dataModel';
import React from 'react'

const Notespage = async ({params}:{params:Promise<{noteId:string}>}) => {
    const {noteId} = await params;
  return (
    <div className="h-screen flex flex-col dark:bg-[#1f1f1f] ">
        <Notecomponent noteId={noteId as Id<'notes'> } />
    </div>
  )
}

export default Notespage