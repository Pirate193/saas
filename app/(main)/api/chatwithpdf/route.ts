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
    fileDetails,
    webSearch,
    studyMode,
    thinking
  }: {
    messages: UIMessage[],
    convexToken?: string,
    contextFolder?: Doc<'folders'>[],
    contextNote?: Doc<'notes'>[],
    pdfText?: string,
    fileDetails?: FileDetails,
    webSearch?: boolean,
    studyMode?: boolean,
    thinking?: boolean
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

  
   const folderContext = (contextFolder && contextFolder.length > 0)
    ? `The user has also tagged the following folders: ${contextFolder.map(f => `"${f.name}" (ID: ${f._id})`).join(', ')}. You can use tools to interact with these folders if needed.`
    : `No folders are currently tagged.`;

  const noteContext = (contextNote && contextNote.length > 0)
    ? `The user has also tagged the following notes: ${contextNote.map(n => `"${n.title}" (ID: ${n._id})`).join(', ')}. You can use tools to interact with these notes if needed.`
    : `No notes are currently tagged.`;

const system = `You are an expert AI study assistant specializing in PDF analysis and active learning facilitation.

## SESSION CONFIGURATION
- **Document**: ${fileDetails?.fileName || 'Unknown'} (${fileDetails?.fileType || 'Unknown'})
- **Study Mode**: ${studyMode ? 'ENABLED' : 'DISABLED'}
- **Web Search**: ${webSearch ? 'ENABLED' : 'DISABLED'}
${folderContext}
${noteContext}

## MODE-SPECIFIC BEHAVIOR
${studyMode ? `### STUDY MODE ACTIVE
You are an interactive tutor. Your approach:
- Ask Socratic questions before providing direct answers
- Guide students to discover knowledge through dialogue
- Create flashcards and practice questions proactively
- Encourage critical thinking and concept connections
- Break down complex topics into digestible pieces` : `### ASSISTANT MODE ACTIVE
You are a direct knowledge assistant. Your approach:
- Provide clear, comprehensive answers immediately
- Use structured formatting (headings, bullets, bold text)
- Be thorough but concise
- Focus on accuracy and clarity`}

## INFORMATION SOURCES
You have access to:
1. **PDF Content** (PRIMARY SOURCE) - See below
2. **Conversation History** - Previous messages in this chat
3. **Tagged Context** - Folders/notes listed above (use tools to explore)
${webSearch ? '4. **Web Search** - Use searchTheWeb for supplementary information' : ''}

## PDF DOCUMENT CONTENT
<PDF_CONTENT>
${pdfText ? `${pdfText.substring(0, 120000)}${pdfText.length > 120000 ? '\n\n[PDF truncated due to length]' : ''}` : 'No PDF content provided.'}
</PDF_CONTENT>

## CRITICAL INSTRUCTIONS

1. **CITE THE PDF**: Always reference the document. Use: "As stated on page X...", "In section Y...", "According to the text..."

2. **SCOPE LIMITATIONS**: 
   - If information is NOT in the PDF${webSearch ? ', you may search the web for supplementary context' : ', clearly state: "This information is not present in the document"'}
   - ${webSearch ? 'When using web results, clearly distinguish them from PDF content' : 'Never invent information not present in the PDF'}

3. **TOOL USAGE PRIORITY**:
   ${studyMode ? '- **HIGH**: generateFlashcards (create study materials proactively)' : ''}
   - **MEDIUM**: createNote (save key insights from the PDF)
   - **LOW**: getfolderitems (explore tagged context if needed)
   - ${webSearch ? '**CONDITIONAL**: searchTheWeb (only when PDF lacks required info)' : ''}

4. **CONVERSATION HISTORY**: Maintain full context from previous messages. Reference past questions/answers to provide continuity.

5. **RESPONSE FORMATTING**:
   - Use markdown for clarity
   - Bold key terms and concepts
   - Quote relevant passages from the PDF
   - Keep paragraphs short and scannable

Begin your response now.`;
  // END SYSTEM PROMPT 

  const tools = createTools(convex);
  
  const result = streamText({
    model: thinking ? google('gemini-2.5-pro') :google('gemini-2.5-flash'),
    messages: convertToModelMessages(messages),
    system: system, 
    tools,
    stopWhen: stepCountIs(10),
  });
  
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
}