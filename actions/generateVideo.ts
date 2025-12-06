"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

import { PDFParse } from "pdf-parse";
import { Id } from "@/convex/_generated/dataModel";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

PDFParse.setWorker('https://cdn.jsdelivr.net/npm/pdf-parse@latest/dist/pdf-parse/web/pdf.worker.mjs');
const videoschema = z.object({
    scenename:z.string(),
    transcript:z.string(),
    code:z.string(),
    title:z.string(),
    description:z.string(),
})

export async function generateVideo(formData:FormData) {
    const prompt = formData.get('prompt') as string;
    const videoId = formData.get("videoId") as Id<'videos'>;
    const file = formData.get("file") as File;
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    if(!videoId){
        throw new Error("Video ID is required");
    }
    let context = "";
    try{
        if(file){
            //@ts-ignore
      const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
      //@ts-ignore
      await import("pdfjs-dist/build/pdf.worker.min.mjs");
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
    const prompt = `
    
    `
    const {object}= await generateObject({
        model:google("gemini-2.5-flash"),
        schema:videoschema,
        prompt:prompt
    })
    console.log('sending code to api ',object.code)
    const response = await fetch('manim-api-92080499980.us-central1.run.app/generate-video',{
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify({
            scene_name:object.scenename,
            transcript:object.transcript,
            code:object.code            
        })
    })
    if(!response.ok){
        console.log('video generation failed',response)
        await convex.mutation(api.videos.updateVideo,{
            videoId:videoId,
            status:'failed',
        })
        return;
    }
    const data = await response.json();
    console.log('video generated ')
    await convex.mutation(api.videos.updateVideo,{
        videoId:videoId,
        url:data.video_url,
        filesize:data.file_size,
        thumbnail:data.thumbnail_url,
        status:'ready',
        title:object.title,
        description:object.description,
    })
    }catch(error){
        console.log('video generation failed',error)
        await convex.mutation(api.videos.updateVideo,{
            videoId:videoId,
            status:'failed',
        })
    }
   
}
    
