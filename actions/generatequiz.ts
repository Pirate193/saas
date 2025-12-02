"use server";

import { google } from "@ai-sdk/google";
import { generateObject } from "ai";

import { z } from "zod";

// Define the structure of a Quiz Question (same as before)
const quizSchema = z.object({
  question: z.string(),
  // 'single' = Radio Button, 'multiple' = Checkboxes
  type: z.enum(["single", "multiple"]),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  options: z.array(z.string()),
  // We now store an ARRAY of correct answers (strings must match options exactly)
  correctAnswers: z.array(z.string()),
  // Instructions for the AI on how to format the explanation
  explanation: z
    .string()
    .describe(
      "A detailed breakdown. If multiple choice, format as: 'Option 1) Correct: [Reason]. Option 2) Incorrect: [Reason]'"
    ),
});

// New schema for the array of quizzes
const quizListSchema = z.object({
  quizzes: z.array(quizSchema).min(1), // Ensure at least one quiz is generated
});

export async function generateQuizzesAction(
  topic: string,
  numQuestions: number,
  noteContent: string = "" // Default to empty string
) {
  "use server";

  // Construct the prompt dynamically
  const systemContext = `
    You are an expert AI Tutor. Your goal is to test the student's understanding of the material they are currently studying.
    
    You will be provided with:
    1. A "Focus Topic" (what the user wants to be quizzed on).
    2. "Current Note Context" (the actual notes the user is writing).
  `;

  // 2. Construct the intelligent prompt
  let promptText = `Generate exactly ${numQuestions} distinct multiple-choice practice problems.`;

  // 3. Inject Context with strict instructions
  if (noteContent && noteContent.trim().length > 10) {
    promptText += `
    
    =========================================
    SOURCE MATERIAL (USER'S NOTES):
    "${noteContent.slice(0, 25000)}" 
    =========================================

    INSTRUCTIONS FOR CONTEXT USAGE:
    1. **Priority**: The questions MUST be based on the "SOURCE MATERIAL" above. Do not ask about things not mentioned in the notes unless the notes are too sparse.
    2. **Relevance**: The user entered the topic "${topic}". Look for that specific section within the source material.
    3. **Style Matching**: Match the difficulty and terminology used in the notes.
    `;
  } else {
    // Fallback if note is empty
    promptText += `
    Context: The user is writing a note about "${topic}" but hasn't written much yet. 
    Instruction: Generate high-quality questions based on general expert knowledge of "${topic}".
    `;
  }

  // 4. Standard Rules (Math, Formatting, Explanations)
  promptText += `
    
    GENERAL RULES:
    1. Topic Focus: "${topic}"
    2. Mix "single" (radio) and "multiple" (checkbox) question types.
    3. For "multiple" choice, ensure 'correctAnswers' includes ALL valid options.
    4. **Explanations**: You MUST explain WHY the correct answer is right AND WHY the distractors are wrong.
    5. **Math**: Use LaTeX wrapped in single $ for equations (e.g. $x^2$).
  `;

  const { object } = await generateObject({
    model: google("gemini-2.0-flash"),
    schema: quizListSchema,
    prompt: promptText,
  });

  return object.quizzes;
}
