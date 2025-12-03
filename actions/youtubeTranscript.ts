'use server';

import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { Innertube } from 'youtubei.js';

// Helper to extract Video ID from any YouTube URL format
function getYoutubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export async function YoutubeTranscribe(url: string) {
  try {
    const videoId = getYoutubeVideoId(url);
    
    if (!videoId) {
      return { error: "Invalid YouTube URL" };
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

    // 5. Send to Gemini
    const { text } = await generateText({
      model: google("gemini-2.0-flash"), // Flash is fast and cheap for this
      messages: [
        {
          role: "user",
          content: `
            You are an expert student. Here is the raw transcript of a YouTube educational video.
            
            TRANSCRIPT:
            "${transcriptText.slice(0, 50000)}" 
            
            INSTRUCTIONS:
            1. Convert this into structured study notes.
            2. Use valid Markdown (# headings, - bullets, \`code\`).
            3. Ignore the "Like and Subscribe" or sponsor segments.
            4. Fix any speech-to-text errors where possible.
            5. Return ONLY the Markdown. Do not wrap in JSON.
          `,
        },
      ],
    });

    return { transcript: text };

  } catch (error: any) {
    console.error("YouTube Transcription Error:", error);
    
    // Provide a user-friendly error message
    let errorMessage = "Failed to transcribe video.";
    
    if (error.message.includes("No transcript")) {
      errorMessage = "This video does not have closed captions/subtitles.";
    } else if (error.message.includes("Sign in")) {
      errorMessage = "This video is age-restricted or requires sign-in.";
    }

    return { error: errorMessage };
  }
}