

'use client';
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Forward, Notebook, Brain, Folder, CheckCircle2, FileSearch } from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useAiStore } from "@/stores/aiStore";
import { useEffect, useMemo } from "react";
import {createNoteOutputSchema,updateNoteOutputSchema,generateFlashcardOutputSchema,getFolderItemsOutputSchema,getUserFlashcardsOutputSchema,getFlashcardOutputSchema} from "@/types/aitoolstypes"

// --- COMPONENTS ---

export const CreateNote = ({ output }: { output: unknown }) => {
  const router = useRouter();
  const {setActiveNoteId,setIsNotePanelOpen}=useAiStore();
  const parsed = useMemo(()=>createNoteOutputSchema.safeParse(output),[output])
  
  useEffect(() => {
    if (parsed.success && parsed.data.success) {
     
      setActiveNoteId(parsed.data.note as Id<'notes'>);
      setIsNotePanelOpen(true);
    }
  }, [output, setActiveNoteId, setIsNotePanelOpen]);
  if (!parsed.success || !parsed.data.success) {
    return null;
  }
  const { data } = parsed;

  // Extract title from message, since output.note is just an ID
  const titleMatch = data.message.match(/Created note: ["'](.+?)["']/);
  const title = titleMatch ? titleMatch[1] : 'Note Created';

  return (
    <Card className="group  transition-all cursor-pointer overflow-hidden flex flex-col border-green-500/30 bg-green-500/5"
    onClick={()=>{
      setActiveNoteId(data.note as Id<'notes'>);
      setIsNotePanelOpen(true);
    }}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Notebook className="h-4 w-4 text-green-600" />
            <CardTitle className="text-sm font-medium text-green-600 truncate">
              {title}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            // Use the output.note string directly as the ID
            onClick={() => {setIsNotePanelOpen(true);
               setActiveNoteId(data.note as Id<'notes'>)}}
          >
            <Forward className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground">
          Note created. Click to open.
        </p>
      </CardContent>
    </Card>
  );
};

// UpdateNote Component (This was correct)
export const UpdateNote = ({ output }: { output: unknown }) => {
  const {setActiveNoteId,setIsNotePanelOpen}=useAiStore();
  const parsed = useMemo(()=>updateNoteOutputSchema.safeParse(output),[output])
   useEffect(() => {
    if (parsed.success && parsed.data.success) {
      setActiveNoteId(parsed.data.note as Id<'notes'>);
      setIsNotePanelOpen(true);
    }
  }, [output, setActiveNoteId, setIsNotePanelOpen]);
  if (!parsed.success || !parsed.data.success) {
    return null;
  }
 const {data}= parsed;
  return (
    <Card className="group  cursor-pointer overflow-hidden flex flex-col border-blue-500/30 bg-blue-500/5"
    onClick={()=>{
      setActiveNoteId(data.note as Id<'notes'>);
      setIsNotePanelOpen(true);
    }}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm font-medium text-blue-600">
              Note Updated
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground">{data.message}</p>
      </CardContent>
    </Card>
  );
};


export const CreateFlashcard = ({ output }: { output: unknown }) => {
  const parsed = useMemo(()=>generateFlashcardOutputSchema.safeParse(output),[output])
  if (!parsed.success || !parsed.data.success) {
    return null;
  }
 const {data}= parsed;
  return (
    <Card className="border-purple-500/30 bg-purple-500/5">
      <CardHeader>
        <div className="flex items-start gap-2">
          <Brain className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <CardTitle className="text-sm font-medium text-purple-600">
              Flashcard Created
            </CardTitle>
          </div>
          <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
    
        <p className="text-xs text-muted-foreground truncate">
          {data.message}
        </p>
      </CardContent>
    </Card>
  );
};


export const GetFolderItems = ({ output }: { output: unknown }) => {
  const parsed = useMemo(()=>getFolderItemsOutputSchema.safeParse(output),[output])
  if (!parsed.success || !parsed.data.success) {
    return null;
  }
 const {data}= parsed;
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <div className="flex items-start gap-2">
          <Folder className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <CardTitle className="text-sm font-medium">
              Analyzed Folder Contents
            </CardTitle>
          </div>
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span> {data.notes.length} notes</span>
          <span>{data.files.length} files</span>
          <span> {data.flashcards.length} flashcards</span>
        </div>
      </CardContent>
    </Card>
  );
};

export const GetUserFlashcards = ({ output }: { output: unknown }) => {
  const parsed = useMemo(()=>getUserFlashcardsOutputSchema.safeParse(output),[output])
  if (!parsed.success || !parsed.data.success) {
    return null;
  }
 const {data}= parsed;
  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader>
        <div className="flex items-start gap-2">
          <Brain className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <CardTitle className="text-sm font-medium text-amber-600">
              Retrieved Flashcards
            </CardTitle>
          </div>
          <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground">
          Found {data.count} flashcard{data.count !== 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  );
};


export const GetFlashcard = ({ output }: { output: unknown }) => {
  const parsed = useMemo(()=>getFlashcardOutputSchema.safeParse(output),[output])
  if (!parsed.success || !parsed.data.success) {
    return null;
  }
 const {data}= parsed;
  return (
    <Card className="border-teal-500/30 bg-teal-500/5">
      <CardHeader>
        <div className="flex items-start gap-2">
          <FileSearch className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <CardTitle className="text-sm font-medium text-teal-600">
              Analyzed Flashcard
            </CardTitle>
          </div>
          <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground truncate mb-1">
          {data.flashcard.question}
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>Success: {data.stats.successRate}</span>
          <span>Reviews: {data.stats.totalReviews}</span>
        </div>
      </CardContent>
    </Card>
  );
};