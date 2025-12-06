import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { Id } from "@/convex/_generated/dataModel";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// This maxDuration works in API routes!
export const maxDuration = 300; // 5 minutes

const videoschema = z.object({
    scenename: z.string(),
    transcript: z.string(),
    code: z.string(),
    title: z.string(),
    description: z.string(),
});

export async function POST(request: NextRequest) {
    const formData = await request.formData();
    
    const prompt = formData.get('prompt') as string;
    const folderId = formData.get("folderId") as Id<'folders'>;
    const file = formData.get("file") as File;
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const convexToken = formData.get("convexToken") as string;
    
    if (!folderId) {
        return NextResponse.json({ error: "Folder ID is required" }, { status: 400 });
    }
    if (convexToken) {
    convex.setAuth(convexToken);
  } else {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
    });
  }
   console.log("folderId", folderId);
    let context = "";
    try {
        if (file) {
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
        
       await convex.mutation(api.videos.schedulevideogeneration,{
        folderId:folderId,
        prompt:prompt,
        context:context,
       })
        
        return NextResponse.json({ success: true });
        
    } catch (error) {
        console.log('video generation failed', error);
        return NextResponse.json({ error: "Video generation failed" }, { status: 500 });
    }
}
