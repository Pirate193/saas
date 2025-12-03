import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import path from "path";
import fs from "fs";
import os from "os";
// Allow this route to run for up to 5 minutes
export const maxDuration = 300; 

export async function POST(req: Request) {
  const { storageId } = await req.json();

  if (!storageId) return new Response("Missing storageId", { status: 400 });

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  const fileManager = new GoogleAIFileManager(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

  let tempFilePath = "";
  let uploadResult = null;

  try {
    // 1. Get the Download URL from Convex
    console.log("1. Fetching URL from Convex...");
    const fileUrl = await convex.query(api.folders.getUrl, { storageId });
    if (!fileUrl) throw new Error("Could not find file URL in Convex");

    console.log("2. Downloading file...");
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);

    // FIX: Don't use streams. Load into memory (Buffer) and write sync.
    // This prevents the "hanging" issue with mismatched stream types.
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a temp file path in /tmp
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, `recording-${Date.now()}.webm`);
    fs.writeFileSync(tempFilePath, buffer);
    
    console.log(`   Saved to ${tempFilePath} (${buffer.length} bytes)`);

    // 3. Upload to Google AI File Manager
    console.log("3. Uploading to Google Gemini...");
    uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: "video/webm",
      displayName: "Class Recording",
    });

    const fileUri = uploadResult.file.uri;
    const fileName = uploadResult.file.name;
    console.log(`   File uploaded: ${fileUri}`);

    // 4. Wait for Google to process the video
    let file = await fileManager.getFile(fileName);
    while (file.state === FileState.PROCESSING) {
      console.log("   Waiting for video processing...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      file = await fileManager.getFile(fileName);
    }

    if (file.state === FileState.FAILED) {
      throw new Error("Google failed to process the video file.");
    }

    // 5. Generate Markdown with Vercel AI SDK
    console.log("5. Generating transcript...");
    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert student note-taker. Watch this class recording.
                     1. Extract the key learning outcomes and summary.
                     2. Ignore filler words, silence, and logistical chatter.
                     3. Output **ONLY valid Markdown**.
                     4. Use headings (#, ##), bullet points (-), and code blocks where applicable.
                     5. Do NOT wrap the output in a JSON block. Just return the markdown string.`,
            },
            {
              type: "file",
              data: fileUri,
              mediaType: "video/webm",
            },
          ],
        },
      ],
    });

    return Response.json({ transcript: text });

  } catch (error: any) {
    console.error("Transcription error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  } finally {
    // 6. Cleanup resources
    try {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      if (uploadResult) await fileManager.deleteFile(uploadResult.file.name);
      await convex.mutation(api.files.deletefilefromstorage, { storageId });
      console.log("Cleanup complete");
    } catch (e) {
      console.error("Cleanup failed", e);
    }
  }
}