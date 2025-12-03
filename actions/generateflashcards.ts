"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { YoutubeTranscript } from "youtube-transcript";
import { Innertube } from 'youtubei.js';

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
function getYoutubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}



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
       const videoId = getYoutubeVideoId(url);
          
          if (!videoId) {
            throw new Error("Invalid YouTube URL");
          }
      
          console.log(`Fetching transcript for ID: ${videoId}...`);
      
          // 1. Initialize Innertube (Mimics a real YouTube client)
          const youtube = await Innertube.create();
      
          // 2. Fetch Video Info
          const info = await youtube.getInfo(videoId);
      
          // 3. Get Transcript Data
          const transcriptData = await info.getTranscript();
      
          if (!transcriptData || !transcriptData.transcript || !transcriptData.transcript.content?.body) {
             throw new Error("No transcript available for this video.");
          }
      
          // 4. Convert segments to a single string
          // content.body.runs[0].text is the path to the text in Innertube objects
          const transcriptText = transcriptData.transcript.content.body.initial_segments
            .map((segment: any) => segment.snippet.text)
            .join(" ");
      
          console.log("Transcript:", transcriptText);
          console.log("Transcript length:", transcriptText.length);
          context = transcriptText.slice(0, 30000);
    } else if (type === "pdf") {
      //@ts-ignore
      const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
      //@ts-ignore
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