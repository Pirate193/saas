import { ConvexHttpClient } from "convex/browser";
import {GoogleGenAI} from '@google/genai';
import { api } from "@/convex/_generated/api";

export const maxDuration = 300;

export async function POST(req:Request){
    const {storageId} = await req.json();

     const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
     const filemanger = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY });
     try{
        const fileUrl = await convex.query(api.folders.getUrl,{storageId:storageId});
        if (!fileUrl){
            throw new Error("File not found");
        }
        console.log('downloading file');
        const response = await fetch(fileUrl);
        if (!response.ok){
            throw new Error("Failed to download file");
        }
        const blob = await response.blob();
        const fs = require('fs');
        const path = require('path');
        const tempFilePath = path.join('/tmp',`recording-${Date.now()}.webm`);
        const buffer = Buffer.from(await blob.arrayBuffer());
        fs.writeFileSync(tempFilePath,buffer);
        console.log('file saved to',tempFilePath);
        console.log('uploading to gemini');
        const uploadResult = await filemanger.files.upload({config:{mimeType:'video/webm' || blob.type},
        file:fs.createReadStream(tempFilePath)
        })
        let file = await filemanger.files.get(uploadResult.name);

    // 4. Wait for Google to process the video (It needs to index it)
    while (file.state === FileState.PROCESSING) {
      console.log("Google is processing video...");
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5s
      file = await fileManager.getFile(uploadResult.file.name);
    }

    if (file.state === FileState.FAILED) {
      throw new Error("Google failed to process video");
    }
}