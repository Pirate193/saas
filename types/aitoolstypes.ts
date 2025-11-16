import { z } from 'zod';
import { Doc } from '@/convex/_generated/dataModel';

// We can't easily validate a full Convex Doc<> with Zod,
// so we'll just check for 'object' and use TypeScript types for the rest.
const convexDocSchema = z.object({}); 
const convexDocArraySchema = z.array(convexDocSchema);

const flashcardSchema = z.object({
  _id: z.string(),
  question: z.string(),
  answers: z.array(z.object({
    text: z.string(),
    isCorrect: z.boolean(),
  })),
  isMultipleChoice: z.boolean(),
});

// Base schemas
const successSchema = z.object({ success: z.literal(true) });
export const errorSchema = z.object({ success: z.literal(false), error: z.string() });

// --- Define a Zod schema for EACH tool's successful output ---

export const createNoteOutputSchema = successSchema.extend({
  note: z.string(), 
  message: z.string(),
});

export const updateNoteOutputSchema = successSchema.extend({
  note: z.string(),
  message: z.string(),
});

export const generateFlashcardOutputSchema = successSchema.extend({
  flashcard: z.string(),
  message: z.string(),
});

export const getFolderItemsOutputSchema = successSchema.extend({
  notes: convexDocArraySchema,
  files: convexDocArraySchema,
  flashcards: convexDocArraySchema,
  summary: z.string(),
});

export const getUserFlashcardsOutputSchema = successSchema.extend({
  flashcards: convexDocArraySchema,
  count: z.number(),
});

export const getFlashcardOutputSchema = successSchema.extend({
  flashcard: flashcardSchema,
  stats: z.object({
    successRate: z.string(),
    totalReviews: z.number(),
    correctReviews: z.number(),
    isStruggling: z.boolean(),
  })
});

export const createFolderOutputSchema = successSchema.extend({
  folder: z.string(),
  message: z.string(),
});
export const updateFolderOutputSchema = successSchema.extend({
  message: z.string(),
});
// --- (Optional but Recommended) Export the inferred TypeScript types ---

export type CreateNoteOutput = z.infer<typeof createNoteOutputSchema>;
export type UpdateNoteOutput = z.infer<typeof updateNoteOutputSchema>;
export type GenerateFlashcardOutput = z.infer<typeof generateFlashcardOutputSchema>;
export type GetFlashcardOutput = z.infer<typeof getFlashcardOutputSchema>;
export type CreateFolderOutput = z.infer<typeof createFolderOutputSchema>;
export type UpdateFolderOutput = z.infer<typeof updateFolderOutputSchema>;
// For types with Convex Docs, we can be more specific
export type GetFolderItemsOutput = {
  success: true;
  notes: Doc<"notes">[];
  files: Doc<"files">[];
  flashcards: Doc<"flashcards">[];
  summary: string;
};

export type GetUserFlashcardsOutput = {
  success: true;
  flashcards: Doc<"flashcards">[];
  count: number;
};

export type GenerateFlashcardsOutput = {
  success: true;
  flashcards: Doc<"flashcards">[];
  message: string;
};