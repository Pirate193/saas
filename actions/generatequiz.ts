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
  explanation: z.string().describe("A detailed breakdown. If multiple choice, format as: 'Option 1) Correct: [Reason]. Option 2) Incorrect: [Reason]'"),
});

// New schema for the array of quizzes
const quizListSchema = z.object({
  quizzes: z.array(quizSchema).min(1), // Ensure at least one quiz is generated
});

export async function generateQuizzesAction(topic: string, numQuestions: number) {
  "use server";
  
  const { object } = await generateObject({
    model: google('gemini-2.0-flash'), 
    schema: quizListSchema, // Use the new list schema
    prompt: `Generate exactly ${numQuestions} distinct multiple-choice practice problems about: "${topic}". 
    
    Rules:
    1. Mix between "single" choice (one correct answer) and "multiple" choice (select all that apply).
    2. If "multiple" choice, ensure you select ALL correct options in 'correctAnswers'.
    3. For the 'explanation': 
       - You MUST explain why the correct answer is right.
       - You MUST explain why the incorrect options are wrong.
       - Format it clearly (e.g., "A) Incorrect because... B) Correct because...").
    4. Use LaTeX formatting (wrapped in $) for math.
    `,
  });

  return object.quizzes; // Return the array of quizzes
}