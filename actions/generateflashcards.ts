"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { YoutubeTranscript } from "youtube-transcript";

import { PDFParse } from "pdf-parse";
PDFParse.setWorker('https://cdn.jsdelivr.net/npm/pdf-parse@latest/dist/pdf-parse/web/pdf.worker.mjs');
const FlashcardSchema = z.object({
  flashcards: z.array(
    z.object({
      question: z.string(),
      answers: z.array(
        z.object({
          text: z.string(),
          isCorrect: z.boolean(),
        })
      ),
      explanation: z.string(),
    })
  ),
});


export async function generateFlashcardsContent(formData: FormData) {
  // 1. Extract all fields
  const type = formData.get("type") as "topic" | "text" | "youtube" | "pdf";
  const topic = formData.get("topic") as string;
  const description = formData.get("description") as string; // <--- RESTORED
  const count = Number(formData.get("count"));
  const isMcq = formData.get("isMcq") === "true";
  const optionsCount = Number(formData.get("optionsCount")) || 4; // <--- RESTORED

  let context = "";

  // 2. Extract Context based on Source
  try {
    if (type === "text") {
      // NEW: Handle raw text
      context = (formData.get("text") as string).slice(0, 30000);
    } else if (type === "youtube") {
      const url = formData.get("url") as string;
      const transcript = await YoutubeTranscript.fetchTranscript(url);
      context = transcript.map((t: any) => t.text).join(" ").slice(0, 30000);
      console.log(transcript);
    } else if (type === "pdf") {
      const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
      await import("pdfjs-dist/build/pdf.worker.min.mjs");

      const file = formData.get("file") as File;
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF document
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      // Extract text from all pages
      const textPages: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .join(' ');
        textPages.push(pageText);
      }
      
      context = textPages.join('\n').slice(0, 30000);
      console.log(`Extracted ${pdf.numPages} pages from PDF content${context}`);
    }
    
  } catch (error) {
    console.error("Extraction error", error);
    throw new Error("Failed to process source. Please check your file or URL.");
  }

  // 3. Construct a Detailed Prompt
  const prompt = `
    You are an expert study aid generator.
    Create ${count} ${isMcq ? "Multiple Choice" : "Question & Answer"} flashcards.
    
    Subject/Topic: ${topic}
    ${description ? `Specific Instructions: ${description}` : ""}
    
    ${context ? `Base your questions STRICTLY on this context:\n${context}` : ""}

    Requirements:
    ${isMcq ? `- Provide exactly ${optionsCount} options per question.` : "- Provide 1 correct answer."}
    ${isMcq ? "- Mark exactly one option as correct." : ""}
    - Provide a concise, helpful explanation for the correct answer.
  `;

  // 4. Generate
  const { object } = await generateObject({
    model: google("gemini-2.0-flash"),
    schema: FlashcardSchema,
    prompt: prompt,
  });

  return object.flashcards;
}