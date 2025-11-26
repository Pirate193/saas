"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const GradeSchema = z.object({
  isCorrect: z.boolean().describe("True if the user understood the core concept, even if phrased differently."),
  score: z.number().min(0).max(100).describe("A confidence score of how well they knew it."),
  feedback: z.string().describe("Encouraging feedback explaining why they were right or wrong."),
  missedKeyConcepts: z.array(z.string()).describe("List of specific keywords or concepts the user forgot to mention."),
});

export async function gradeFlashcardAnswer(userAnswer: string, correctAnswer: string, question: string) {
  const { object } = await generateObject({
    model: google("gemini-2.0-flash"), 
    schema: GradeSchema,
    prompt: `
      You are a strict but helpful tutor.
      Question: "${question}"
      Official Answer: "${correctAnswer}"
      Student Answer: "${userAnswer}"
      
      Compare the Student Answer to the Official Answer. 
      - If the student captures the MAIN IDEA, mark as correct.
      - If they miss critical nuance, mark as incorrect.
      - Be forgiving of typos.
    `,
  });
  console.log(object);
  return object;
}