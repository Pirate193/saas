import Editor from '@/components/notescomponents/editor';
import React from 'react'

const Notespage = async ({params}:{params:Promise<{noteId:string}>}) => {
    const {noteId} = await params;
  return (
    <div>Notespage
      
        Note ID: {noteId}
        <Editor />
    </div>
  )
}

export default Notespage