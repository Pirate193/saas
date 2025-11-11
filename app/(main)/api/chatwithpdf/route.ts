import { streamText, UIMessage, convertToModelMessages, tool, stepCountIs } from "ai";
import { google } from '@ai-sdk/google';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
// We can re-use the tools from the main chat route
import { createTools } from "../chat/route";

export const maxDuration = 60; // Increase duration for PDF processing

// +++ DEFINE TYPE FOR FILE DETAILS +++
type FileDetails = {
  fileName: string;
  fileType: string;
}

export async function POST(req: Request) {
  // +++ DESTRUCTURE NEW DATA FROM BODY +++
  const {
    messages,
    convexToken,
    contextFolder,
    contextNote,
    pdfText,
    fileDetails
  }: {
    messages: UIMessage[],
    convexToken?: string,
    contextFolder?: Doc<'folders'>[],
    contextNote?: Doc<'notes'>[],
    pdfText?: string,
    fileDetails?: FileDetails
  } = await req.json();
  
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  
  if (convexToken) {
    convex.setAuth(convexToken);
  } else {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }), 
      { status: 401 }
    );
  }

  // +++ BUILD DYNAMIC SYSTEM PROMPT +++
 const folderContext = (contextFolder && contextFolder.length > 0)
    ? `The user has also tagged the following folders: ${contextFolder.map(f => `"${f.name}" (ID: ${f._id})`).join(', ')}. You can use tools to interact with these folders if needed.`
    : `No folders are currently tagged.`;

  const noteContext = (contextNote && contextNote.length > 0)
    ? `The user has also tagged the following notes: ${contextNote.map(n => `"${n.title}" (ID: ${n._id})`).join(', ')}. You can use tools to interact with these notes if needed.`
    : `No notes are currently tagged.`;

  const pdfContext = pdfText
    ? `--- PDF CONTENT START ---
${pdfText}
--- PDF CONTENT END ---`
    : `The user has not provided any PDF text.`;

  const system = `You are an expert AI study assistant specializing in analyzing PDF documents.
Your goal is to help a student understand the content of their file.

FILE & CONTEXT:
- File Name: ${fileDetails?.fileName || 'Unknown'}
- File Type: ${fileDetails?.fileType || 'Unknown'}
- ${folderContext}
- ${noteContext}

YOUR TASK:
1.  You will be given text extracted from the user's PDF file. This is your primary source of information.
2.  The user will ask you a question *about* this PDF text.
3.  Your answer MUST be based on the provided PDF text.
4.  If the answer is not in the text, clearly state that the information is not present in the document.
5.  You have access to tools to create notes, flashcards, etc. Use them if the user asks, referencing the PDF content.
6.  Be concise, accurate, and helpful.

Here is the full text from the PDF:
${pdfContext}
`;
  // +++ END SYSTEM PROMPT +++

  const tools = createTools(convex);
  
  const result = streamText({
    model: google('gemini-2.5-flash'),
    messages: convertToModelMessages(messages),
    system: system, // Use our new powerful prompt
    tools,
    stopWhen: stepCountIs(10),
  });
  
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
}