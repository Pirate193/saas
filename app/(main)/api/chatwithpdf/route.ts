import { streamText, UIMessage, convertToModelMessages, tool, stepCountIs } from "ai";
import { google, GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';
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
    thinking,
    fileId,
  }: {
    messages: UIMessage[],
    convexToken?: string,
    contextFolder?: Doc<'folders'>[],
    contextNote?: Doc<'notes'>[],
    pdfText?: string,
    fileDetails?: FileDetails,
    fileId: Id<'files'>,
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
  console.log("fileId", fileId);

  
   const folderContext = (contextFolder && contextFolder.length > 0)
    ? `The user has also tagged the following folders: ${contextFolder.map(f => `"${f.name}" (ID: ${f._id})`).join(', ')}. You can use tools to interact with these folders if needed.`
    : `No folders are currently tagged.`;

  const noteContext = (contextNote && contextNote.length > 0)
    ? `The user has also tagged the following notes: ${contextNote.map(n => `"${n.title}" (ID: ${n._id})`).join(', ')}. You can use tools to interact with these notes if needed.`
    : `No notes are currently tagged.`;
const notecontentrules = `
When creating or updating notes, you MUST use the structured JSON format, NOT markdown.

### Block Types Available:

1. **Heading**: { "type": "heading", "level": "1"|"2"|"3", "text": "..." }
2. **Paragraph**: { "type": "paragraph", "text": "..." }
3. **Bullet List**: { "type": "bulletList", "items": ["item1", "item2"] }
4. **Numbered List**: { "type": "numberedList", "items": ["item1", "item2"] }
5. **Check List**: { "type": "checkList", "items": [{"text": "...", "checked": true}] }
6. **Code Block**: { "type": "codeBlock", "language": "python", "code": "..." }
7. **Quote**: { "type": "quote", "text": "..." }
8. **Divider**: { "type": "divider" }
9. **Table**: { "type": "table", "headers": [...], "rows": [[...], [...]] }
10. **YouTube**: { "type": "youtube", "url": "https://youtube.com/watch?v=..." }
11. **Quiz**: { "type": "quiz", "topic": "...", "questions": [...] }

### Inline Formatting in Text:
- Bold: **text**
- Italic: *text*
- Code: \`code\`
- Math: $formula$ (use LaTeX: $\\frac{a}{b}$, $x^2$, $\\sqrt{x}$)

### Complete Example:

{
  "title": "Introduction to Calculus",
  "blocks": [
    {
      "type": "heading",
      "level": "1",
      "text": "Introduction to Calculus"
    },
    {
      "type": "paragraph",
      "text": "Calculus studies continuous change. The derivative formula is $f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$."
    },
    {
      "type": "codeBlock",
      "language": "python",
      "code": "def derivative(f, x, h=0.001):\\n    return (f(x + h) - f(x)) / h"
    },
    {
      "type": "youtube",
      "url": "https://www.youtube.com/watch?v=WUvTyaaNkzM"
    },
    {
      "type": "divider"
    },
    {
      "type": "quiz",
      "topic": "Derivatives",
      "questions": [
        {
          "question": "What is the derivative of $x^2$?",
          "type": "single",
          "difficulty": "Easy",
          "options": ["$x$", "$2x$", "$x^2$", "$2x^2$"],
          "correctAnswers": ["$2x$"],
          "explanation": "Using the power rule: $\\frac{d}{dx}(x^n) = nx^{n-1}$, so $\\frac{d}{dx}(x^2) = 2x$."
        }
      ]
    }
  ]
}

## Rules:
1. Always use this structured JSON format when calling createNote or updateNote
2. NO markdown syntax in the JSON structure
3. Text fields can use inline formatting: **bold**, *italic*, \`code\`, $math$
4. Quiz questions must have valid correctAnswers matching options exactly
5. YouTube URLs will be auto-converted to embed format

This structured approach ensures perfect conversion with no parsing errors.

`;
  const userInfo = await convex.query(api.user.getCurrentUser);
const system = `
## 1. CORE IDENTITY
You are an expert AI academic assistant and tutor. You are analyzing the document "**${fileDetails?.fileName}**" (ID: ${fileId}).

## 2. SESSION CONTEXT
- **Active File ID**: ${fileId} (IMPORTANT: Pass this ID when using the \`searchWithPdf\` tool)
- **Study Mode**: ${studyMode ? 'ACTIVE (Tutor Mode)' : 'INACTIVE (Assistant Mode)'}
- **Web Search**: ${webSearch ? 'Enabled' : 'Disabled'} 
- ${folderContext}
- ${noteContext}
- ** user name is ${userInfo?.name} use this name when addressing the user**

## 3. HOW TO HANDLE THIS PDF
You have two ways to read the document:
1. **Immediate Context**: The first ~20 pages are pasted below. Use this for general summaries.
2. **RAG Tool (\`searchWithPdf\`)**: If the user asks a specific question ("What does it say about X?"), you MUST use the \`searchWithPdf\` tool with the \`fileId: "${fileId}"\`. This finds exact quotes and page numbers.

## 4. TOOL USAGE RULES
- **Flashcards**: If the user wants to study, analyze the PDF content and use \`generateFlashcards\`.
- **Notes**: If the user wants to save information, use \`createNote\`.
- **Visuals**: If a concept is complex (processes, hierarchies), use \`generateMermaidDiagram\`.

## 5. NOTE TAKING FORMAT (CRITICAL)
   -${notecontentrules}

## 6. CITATION RULES
When answering questions based on the PDF (either from context or the tool):
- Cite your sources inline using brackets like **[1]**, **[2]**.
- If using the \`searchWithPdf\` tool, the tool output will provide these index numbers.

## 7. DOCUMENT CONTENT (PREVIEW)
<PDF_PREVIEW>
${pdfText ? pdfText.slice(0, 50000) : "No text preview available."}
... [Content truncated, use searchWithPdf tool for more]
</PDF_PREVIEW>

### SOP: CREATING NOTES
When asked to create a note, you MUST follow this strictly:
1. **Plan**: Outline the topic.
2. **Search Video**: You MUST call the \`youtubeVideo\` tool to find a real, relevant tutorial link for the topic.
3. **Generate Content**: Create the note using the \`createNote\` tool.
   - The note MUST include the YouTube video you found (using the 'youtubeVideo' block type).
   - The note MUST end with a 'quiz' block containing 3-5 questions to test the user.
   - Use 'heading', 'codeBlock', and 'table' blocks to make it rich.

### SOP: UPDATING NOTES
When asked to update or add to a note, you MUST:
1. **Fetch**: Call \`getNoteContent\` to read the current text (it returns Markdown).if you see @youtube[] that is a youtube video link or @quiz[] that is a quiz block (it is how the function converts blocknote to markdown for you dont use the symbols anywhere they are for you).
2. **Update**: Update the note using the \`updateNote\` tool.
`;
  // END SYSTEM PROMPT 

  const tools = createTools(convex);
  
  const result = streamText({
    model:google('gemini-2.5-pro') ,
    messages: convertToModelMessages(messages),
    system: system, 
     providerOptions: {
          google: {
            thinkingConfig: {
              thinkingBudget: 8192,
              includeThoughts: true,
            },
          } satisfies GoogleGenerativeAIProviderOptions,
        },
    tools,
    stopWhen: stepCountIs(10),
  });
  
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
}