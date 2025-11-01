import FlashcardList from '@/components/flashcardComponents/flashcardsList'
import { Id } from '@/convex/_generated/dataModel'
import React from 'react'

const FlashcardPage = async ({params}:{params:Promise<{folderId:string}>}) => {
    const {folderId} = await params
  return (
    <div>
        <FlashcardList folderId={folderId as Id<'folders'>} />
    </div>
  )
}

export default FlashcardPage