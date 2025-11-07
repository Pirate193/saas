'use client';
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Forward, Notebook, Brain, Folder, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

// Type guards to safely check output types
function isCreateNoteOutput(output: unknown): output is {
  success: boolean;
  noteId: string;
  message: string;
} {
  return (
    typeof output === 'object' &&
    output !== null &&
    'success' in output &&
    'noteId' in output
  );
}

function isUpdateNoteOutput(output: unknown): output is {
  success: boolean;
  message: string;
} {
  return (
    typeof output === 'object' &&
    output !== null &&
    'success' in output &&
    'message' in output
  );
}

function isGenerateFlashcardOutput(output: unknown): output is {
  success: boolean;
  flashcard: string;
  message: string;
} {
  return (
    typeof output === 'object' &&
    output !== null &&
    'success' in output &&
    'flashcard' in output
  );
}

function isGetFolderItemsOutput(output: unknown): output is {
  success: boolean;
  notes: any[];
  files: any[];
  flashcards: any[];
  summary: string;
} {
  return (
    typeof output === 'object' &&
    output !== null &&
    'success' in output &&
    'notes' in output
  );
}

function isGetUserFlashcardsOutput(output: unknown): output is {
  success: boolean;
  flashcards: any[];
  count: number;
  message: string;
} {
  return (
    typeof output === 'object' &&
    output !== null &&
    'success' in output &&
    'flashcards' in output
  );
}

// CreateNote Component
export const CreateNote = ({ output }: { output: unknown }) => {
  const router = useRouter();

  if (!isCreateNoteOutput(output) || !output.success) {
    return null;
  }

  // Extract title from message (e.g., "Created note: 'Title'")
  const titleMatch = output.message.match(/Created note: ["'](.+?)["']/);
  const title = titleMatch ? titleMatch[1] : 'Untitled Note';

  return (
    <Card className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden flex flex-col border-green-500/30 bg-green-500/5">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Notebook className="h-4 w-4 text-green-600" />
            <CardTitle className="text-sm font-medium text-green-600">
              {title}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={() => router.push(`/notes/${output.noteId}`)}
          >
            <Forward className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground">
          Note created successfully. Click to open.
        </p>
      </CardContent>
    </Card>
  );
};

// UpdateNote Component
export const UpdateNote = ({ output }: { output: unknown }) => {
  const router = useRouter();

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

// CreateFlashcard Component
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
        <p className="text-xs text-muted-foreground">{output.message}</p>
      </CardContent>
    </Card>
  );
};

// GetFolderItems Component
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

// GetUserFlashcards Component
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