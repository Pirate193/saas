

'use client';
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Forward, Notebook, Brain, Folder, CheckCircle2, FileSearch } from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

// --- TYPE GUARD HELPERS ---

// createNote: output.note is a string ID
type CreateNoteOutput = {
  success: boolean;
  note: string; // <-- This is a string (ID)
  message: string;
}
function isCreateNoteOutput(output: unknown): output is CreateNoteOutput {
  return (
    typeof output === 'object' && output !== null &&
    'success' in output && 'note' in output && 
    typeof (output as any).note === 'string' // Check for string
  );
}

type UpdateNoteOutput = {
  success: boolean;
  message: string;
}
function isUpdateNoteOutput(output: unknown): output is UpdateNoteOutput {
  return (
    typeof output === 'object' && output !== null &&
    'success' in output && 'message' in output
  );
}

// generateFlashcards: output.flashcard is a string ID
type GenerateFlashcardOutput = {
  success: boolean;
  flashcard: string; // <-- This is a string (ID)
  message: string;
}
function isGenerateFlashcardOutput(output: unknown): output is GenerateFlashcardOutput {
  return (
    typeof output === 'object' && output !== null &&
    'success' in output && 'flashcard' in output && 
    typeof (output as any).flashcard === 'string' // Check for string
  );
}

// getfolderitems: Returns full arrays of objects
type GetFolderItemsOutput = {
  success: boolean;
  notes: Doc<"notes">[];
  files: Doc<"files">[];
  flashcards: Doc<"flashcards">[];
  summary: string;
}
function isGetFolderItemsOutput(output: unknown): output is GetFolderItemsOutput {
  return (
    typeof output === 'object' && output !== null &&
    'success' in output && 'notes' in output && Array.isArray((output as any).notes)
  );
}

// getUserFlashcards: Returns a full array of objects
type GetUserFlashcardsOutput = {
  success: boolean;
  flashcards: Doc<"flashcards">[];
  count: number;
}
function isGetUserFlashcardsOutput(output: unknown): output is GetUserFlashcardsOutput {
  return (
    typeof output === 'object' && output !== null &&
    'success' in output && 'flashcards' in output && Array.isArray((output as any).flashcards)
  );
}

// getFlashcard: Returns a full object
type GetFlashcardOutput = {
  success: boolean;
  flashcard: Doc<"flashcards">;
  stats: {
    successRate: string;
    totalReviews: number;
    correctReviews: number;
    isStruggling: boolean;
  }
}
function isGetFlashcardOutput(output: unknown): output is GetFlashcardOutput {
  return (
    typeof output === 'object' && output !== null &&
    'success' in output && 'flashcard' in output && 'stats' in output
  );
}

// --- COMPONENTS ---

// CreateNote Component (Corrected)
export const CreateNote = ({ output }: { output: unknown }) => {
  const router = useRouter();

  if (!isCreateNoteOutput(output) || !output.success) {
    return null;
  }

  // Extract title from message, since output.note is just an ID
  const titleMatch = output.message.match(/Created note: ["'](.+?)["']/);
  const title = titleMatch ? titleMatch[1] : 'Note Created';

  return (
    <Card className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden flex flex-col border-green-500/30 bg-green-500/5">
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
            onClick={() => router.push(`/notes/${output.note}`)}
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
  if (!isUpdateNoteOutput(output) || !output.success) {
    return null;
  }

  return (
    <Card className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden flex flex-col border-blue-500/30 bg-blue-500/5">
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
        <p className="text-xs text-muted-foreground">{output.message}</p>
      </CardContent>
    </Card>
  );
};

// CreateFlashcard Component (Corrected)
export const CreateFlashcard = ({ output }: { output: unknown }) => {
  if (!isGenerateFlashcardOutput(output) || !output.success) {
    return null;
  }

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
        {/* We just show the message, as we don't have the full flashcard object */}
        <p className="text-xs text-muted-foreground truncate">
          {output.message}
        </p>
      </CardContent>
    </Card>
  );
};

// GetFolderItems Component (This was correct)
export const GetFolderItems = ({ output }: { output: unknown }) => {
  if (!isGetFolderItemsOutput(output) || !output.success) {
    return null;
  }

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
          <span>📝 {output.notes.length} notes</span>
          <span>📎 {output.files.length} files</span>
          <span>🎴 {output.flashcards.length} flashcards</span>
        </div>
      </CardContent>
    </Card>
  );
};

// GetUserFlashcards Component (This was correct)
export const GetUserFlashcards = ({ output }: { output: unknown }) => {
  if (!isGetUserFlashcardsOutput(output) || !output.success) {
    return null;
  }

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
          Found {output.count} flashcard{output.count !== 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  );
};

// GetFlashcard Component (This was correct)
export const GetFlashcard = ({ output }: { output: unknown }) => {
  if (!isGetFlashcardOutput(output) || !output.success) {
    return null;
  }

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
          {output.flashcard.question}
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>Success: {output.stats.successRate}</span>
          <span>Reviews: {output.stats.totalReviews}</span>
        </div>
      </CardContent>
    </Card>
  );
};