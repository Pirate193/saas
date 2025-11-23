"use client";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Forward,
  Notebook,
  Brain,
  Folder,
  CheckCircle2,
  FileSearch,
  Terminal,
  ArrowRight,
  Code2,
  FileText,
  PenLine,
  BrainCircuit,
  Layers,
} from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useAiStore } from "@/stores/aiStore";
import { useEffect, useMemo } from "react";
import {
  createNoteOutputSchema,
  updateNoteOutputSchema,
  generateFlashcardOutputSchema,
  getFolderItemsOutputSchema,
  getUserFlashcardsOutputSchema,
  getFlashcardOutputSchema,
  generateCodeSnippetOutputSchema,
} from "@/types/aitoolstypes";
import { useCanvasStore } from "@/stores/canvasStore";

const FLASHCARD_BASE_CLASSES =
  "group relative flex flex-col items-center justify-center text-center min-h-[200px] w-full max-w-sm p-6 my-4 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer select-none";

const FLASHCARD_TEXT_CLASSES =
  "text-xl md:text-2xl font-medium text-card-foreground leading-snug";

const ARTIFACT_BASE_CLASSES =
  "group relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground w-full max-w-3xl my-4  cursor-pointer";
const ARTIFACT_HEADER_CLASSES =
  "flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 supports-[backdrop-filter]:bg-card/20 supports-[backdrop-filter]:backdrop-blur-md";
const ARTIFACT_CONTENT_PAD = "p-6 min-h-[150px]";
// --- COMPONENTS ---

export const CreateNote = ({ output }: { output: unknown }) => {
  const { openNote } = useCanvasStore();
  const parsed = useMemo(
    () => createNoteOutputSchema.safeParse(output),
    [output]
  );

  if (!parsed.success || !parsed.data.success) {
    return null;
  }
  const { data } = parsed;

  // Extract title from message, since output.note is just an ID
  const titleMatch = data.message.match(/Created note: ["'](.+?)["']/);
  const title = titleMatch ? titleMatch[1] : "Note Created";

  return (
    <div
      onClick={() => openNote(data.note as Id<"notes">)}
      className="inline-flex items-center gap-3 px-4 py-3 my-2 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer shadow-sm select-none"
    >
      {/* Icon Container */}
      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
        <FileText className="h-4 w-4 text-primary" />
      </div>

      {/* Text Content */}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">
          Created "{title}"
        </span>
      </div>
    </div>
  );
};

// UpdateNote Component (This was correct)
export const UpdateNote = ({ output }: { output: unknown }) => {
  const { openNote } = useCanvasStore();
  const parsed = useMemo(
    () => updateNoteOutputSchema.safeParse(output),
    [output]
  );

  if (!parsed.success || !parsed.data.success) {
    return null;
  }
  const { data } = parsed;
  return (
    <div
      onClick={() => openNote(data.note as Id<"notes">)}
      className="inline-flex items-center gap-3 px-4 py-3 my-2 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer shadow-sm select-none"
    >
      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-500/10">
        <PenLine className="h-4 w-4 text-blue-500" />
      </div>

      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">
          Updated Note
        </span>
      </div>
    </div>
  );
};

export const CreateFlashcard = ({ output }: { output: unknown }) => {
  const parsed = useMemo(
    () => generateFlashcardOutputSchema.safeParse(output),
    [output]
  );
  if (!parsed.success || !parsed.data.success) {
    return null;
  }
  const { data } = parsed;
  return (
    <div className={FLASHCARD_BASE_CLASSES}>
      {/* Subtle Icon Background */}
      <div className="absolute top-4 right-4 opacity-10">
        <BrainCircuit className="h-12 w-12 text-primary" />
      </div>

      {/* The Question Text */}
      <h3 className={FLASHCARD_TEXT_CLASSES}>{data.message}</h3>
    </div>
  );
};

export const GetFolderItems = ({ output }: { output: unknown }) => {
  const parsed = useMemo(
    () => getFolderItemsOutputSchema.safeParse(output),
    [output]
  );
  if (!parsed.success || !parsed.data.success) {
    return null;
  }
  const { data } = parsed;
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
  const parsed = useMemo(
    () => getUserFlashcardsOutputSchema.safeParse(output),
    [output]
  );
  if (!parsed.success || !parsed.data.success) {
    return null;
  }
  const { data } = parsed;
  return (
    <div className={FLASHCARD_BASE_CLASSES}>
      {/* Stacked effect visual */}
      <div className="absolute top-3 right-4 flex -space-x-2 opacity-20">
        <div className="h-6 w-4 rounded bg-primary rotate-12"></div>
        <div className="h-6 w-4 rounded bg-primary -rotate-6"></div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Layers className="h-8 w-8 text-primary mb-2" />
        <h3 className={FLASHCARD_TEXT_CLASSES}>
          Found {data.count} Flashcards
        </h3>
        <p className="text-sm text-muted-foreground">
          {data.count > 0 ? "Ready for study session" : "Folder is empty"}
        </p>
      </div>
    </div>
  );
};

export const GetFlashcard = ({ output }: { output: unknown }) => {
  const parsed = useMemo(
    () => getFlashcardOutputSchema.safeParse(output),
    [output]
  );
  if (!parsed.success || !parsed.data.success) {
    return null;
  }
  const { data } = parsed;
  return (
    <div className={FLASHCARD_BASE_CLASSES}>
      <div className="absolute top-4 right-4 opacity-10">
        <BrainCircuit className="h-12 w-12 text-purple-500" />
      </div>

      <h3 className={FLASHCARD_TEXT_CLASSES}>{data.flashcard.question}</h3>
    </div>
  );
};

export const GenerateCodeSnippet = ({ output }: { output: unknown }) => {
  const { openCode } = useCanvasStore();
  const parsed = useMemo(
    () => generateCodeSnippetOutputSchema.safeParse(output),
    [output]
  );

  if (!parsed.success || !parsed.data.success) return null;
  const { data } = parsed;

  // Function to determine color based on language
  const getLangColor = (lang: string) => {
    if (lang.includes("py")) return "text-yellow-400"; // Python
    if (lang.includes("ts") || lang.includes("js")) return "text-blue-400"; // JS/TS
    return "text-zinc-400";
  };

  return (
    <div
      className={ARTIFACT_BASE_CLASSES}
      onClick={() =>
        openCode({
          title: data.title,
          language: data.language,
          code: data.code,
          description: data.description,
        })
      }
    >
      {/* HEADER */}
      <div className={ARTIFACT_HEADER_CLASSES}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-md border border-border">
            <Code2 className={`h-5 w-5 ${getLangColor(data.language)}`} />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold">{data.title}</span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              {data.language}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Terminal className="h-4 w-4" />
        </Button>
      </div>

      {/* CODE PREVIEW AREA - Use bg-muted for standard code block look */}
      <div
        className={`bg-muted ${ARTIFACT_CONTENT_PAD} font-mono text-sm overflow-hidden relative`}
      >
        <div className="flex gap-4">
          {/* Line Numbers - using text-muted-foreground/50 for subtlety */}
          <div className="flex flex-col text-muted-foreground/50 select-none text-right min-w-[24px]">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>
          {/* Code Text - using text-muted-foreground for contrast against bg-muted */}
          <div className="text-muted-foreground whitespace-pre font-medium opacity-90 leading-relaxed">
            {data.code.split("\n").slice(0, 8).join("\n")}...
          </div>
        </div>
        {/* Gradient Overlay using theme colors */}
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-muted to-transparent" />
      </div>
    </div>
  );
};
