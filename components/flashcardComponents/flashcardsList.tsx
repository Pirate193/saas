'use client'

import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useMutation, useQuery } from "convex/react"
import { Skeleton } from "../ui/skeleton"
import { Button } from "../ui/button"
import { Brain, MoreVertical, Play, Plus, Trash2 } from "lucide-react"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../ui/empty"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog"
import { useState } from "react"
import Createflashcard from "./createFlashcard"

interface FlashcardListProps {
    folderId:Id<'folders'>
}

export default function FlashcardList({folderId}:FlashcardListProps) {
    const flashcards = useQuery(api.flashcards.fetchFlashcards,{folderId:folderId})
    const deleteFlashcard = useMutation(api.flashcards.deleteFlashcard)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [flashcardToDelete, setFlashcardToDelete] = useState<Id<'flashcards'> | null>(null)
    const [openCreateFlashcardDialog,setOpenCreateFlashcardDialog] = useState(false)

    const handleDelete =async ()=>{
        if(!flashcardToDelete) return
        await deleteFlashcard({flashcardId:flashcardToDelete})
        setDeleteDialogOpen(false)
        setFlashcardToDelete(null)
    }
    if(flashcards === undefined){
        return (
            <div className="space-y-4" >
                <Skeleton className="h-12 w-full"/>
                <Skeleton className="h-32 w-full"/>
                <Skeleton className="h-32 w-full"/>
            </div>
        )
    }
  return (
    <div className="space-y-6" >
        {/* header */}
        <div className="flex items-center justify-between" >
            <div >
                <h2 className="text-2xl font-bold" >Flashcards </h2>
                <p className="text-sm text-muted-foreground" >{flashcards.length}{flashcards.length === 1 ? 'flashcard' : 'flashcards'}</p>
            </div>
            <div >
                <Button onClick={()=>setOpenCreateFlashcardDialog(true)} >
                    <Plus className="h-4 w-4"/>
                    New Flashcard
                </Button>
            </div>
        </div>
        {flashcards.length === 0 ?(
            <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Brain />
        </EmptyMedia>
        <EmptyTitle>No Flashcards Yet</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t created any flashcards yet. Get started by creating
          your first flashcard.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex ">
          <Button onClick={()=>setOpenCreateFlashcardDialog(true)} >Create Flashcard</Button>
        </div>
      </EmptyContent>
    </Empty>
        ):(
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" >
                {flashcards.map((flashcard)=>(
                    <Card key={flashcard._id} className="hover:shadow-md transition-shadow" >
                      <CardHeader>
                          <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base line-clamp-2">
                      {flashcard.question}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {flashcard.isMultipleChoice ? (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          Multiple Choice
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          Text Answer
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        // onClick={() => {
                        //   setCurrentFlashcard(flashcard.id)
                        //   setCurrentIndex(flashcards.indexOf(flashcard))
                        //   setStudyMode(true)
                        // }}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Study
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setFlashcardToDelete(flashcard._id)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {flashcard.answers.length}{' '}
                    {flashcard.answers.length === 1 ? 'answer' : 'answers'}
                  </p>
                  {flashcard.isMultipleChoice && (
                    <div className="space-y-1">
                      {flashcard.answers.slice(0, 3).map((answer, index) => (
                        <div
                          key={index}
                          className="text-xs text-muted-foreground flex items-center gap-2"
                        >
                          <span className="font-medium">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <span className="truncate">{answer.text}</span>
                        </div>
                      ))}
                      {flashcard.answers.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{flashcard.answers.length - 3} more
                        </p>
                      )}
                    </div>
                  )}
                </div>
                  </CardContent>
                    </Card>
                ))}

            </div>
        )}
           <Createflashcard 
      open={openCreateFlashcardDialog}
      onOpenChange={setOpenCreateFlashcardDialog}
      folderId={folderId}
      />
         {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flashcard</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this flashcard? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
   
    </div>
  )
}
