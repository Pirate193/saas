'use client'
import TiptapEditor from '@/components/notescomponents/noveleditor/TipTapEditor'
import React from 'react'

const Page = () => {
  const [content, setContent] = React.useState('')
  return (
      <div>
      <TiptapEditor
      
      initialContent={content}
      onChangeContent={setContent}/>
      <p>{content}</p> 
    </div>
  )
}

export default Page
