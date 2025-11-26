"use server";
import YoutubeTranscript from 'youtube-transcript';
import pdf from 'pdf-parse';

export async function extractTextFromSource(formData: FormData): Promise<string> {
  const type = formData.get("type") as "youtube" | "pdf";
  
  if (type === "youtube") {
    const url = formData.get("url") as string;
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(url);
      return transcript.map(t => t.text).join(" ");
    } catch (e) {
      throw new Error("Could not fetch YouTube transcript. Video might not have captions.");
    }
  }

  if (type === "pdf") {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file uploaded");
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Parse text
    const data = await pdf(buffer);
    return data.text;
  }

  return "";
}