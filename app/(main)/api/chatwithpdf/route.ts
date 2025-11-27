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
5.  **IMPORTANT**: The \`content\` for \`updateNote\` and \`createNote\` MUST be written in standard **Markdown**.

**IMPORTANT**:  when writing in markdown make sure you follow these syntax 
## Your Output Format Rules:

### Standard Markdown:
- Headings: # ## ### (max 3 levels)
- Bold: **text** or __text__
- Italic: *text* or _text_
- Code: \`inline code\`
- Code blocks: \`\`\`language ... \`\`\`
- Lists: - or 1. or - [ ]
- Tables: | Header | ... |
- Quotes: > text
- Dividers: ---

### Math (Use Single $):
- Inline math: $E=mc^2$
- Complex formulas: $\\frac{a}{b}$, $\\sum_{i=1}^{n}$, $\\sqrt{x}$

### Custom Blocks:

**YouTube Videos**:
@youtube[https://youtube.com/watch?v=VIDEO_ID]

**Quiz/Flashcards** (JSON must be valid):
@quiz[Topic Name]{
[
  {
    "question": "Question text?",
    "type": "single",
    "difficulty": "Easy",
    "options": ["A", "B", "C", "D"],
    "correctAnswers": ["B"],
    "explanation": "Why B is correct. Can use $math$ here."
  }
]
}

## Rules:
1. Output ONLY markdown, no preamble
2. Use single $ for math (not $$)
3. Valid JSON in quiz blocks
4. Include YouTube videos for visual topics
5. Add quizzes after major sections
6. Structure with clear headings
7. Use tables for comparisons

## Example Output:

# Introduction to Topic

Brief overview with key formula $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$.

## Key Concept

Explanation here.

\`\`\`python
# Code example
def example():
    return "Hello"
\`\`\`

@youtube[https://youtube.com/watch?v=relevant_video]

---

 **Quiz/Flashcards** (JSON must be valid):
@quiz[Topic Name]{
[
  {
    "question": "Question text here?",
    "type": "single",
    "difficulty": "Easy",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswers": ["Option B"],
    "explanation": "Detailed explanation here."
  },
  {
    "question": "Another question?",
    "type": "multiple",
    "difficulty": "Medium",
    "options": ["A", "B", "C", "D"],
    "correctAnswers": ["A", "C"],
    "explanation": "Explanation for multiple choice."
  }
]
}

**CRITICAL QUIZ RULES**:
1. The JSON MUST be a valid array inside the outer braces: @quiz[Topic]{ [array] }
2. NO trailing commas in JSON objects or arrays
3. All strings MUST use double quotes, not single quotes
4. Escape special characters: use \\" for quotes inside strings, \\\\ for backslashes
5. For math in explanations, use single $: "explanation": "The formula $x^2$ shows..."
6. Newlines in strings must be escaped: \\n
7. Test that your JSON is valid before outputting

**Valid Example**:
@quiz[Calculus]{
[
  {
    "question": "What is the derivative of $x^2$?",
    "type": "single",
    "difficulty": "Easy",
    "options": ["$x$", "$2x$", "$x^2$", "$2x^2$"],
    "correctAnswers": ["$2x$"],
    "explanation": "Using the power rule: $\\frac{d}{dx}(x^n) = nx^{n-1}$, so $\\frac{d}{dx}(x^2) = 2x^1 = 2x$."
  }
]
}

**Invalid Examples** (DO NOT DO THIS):
❌ @quiz[Topic]{ {"question": "..."} }  // Not an array
❌ @quiz[Topic]{ [..., ] }  // Trailing comma
❌ @quiz[Topic]{ ['options'] }  // Single quotes
❌ @quiz[Topic]{ [..., "explanation": "Use "quotes" here"] }  // Unescaped quotes


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
   -this special format like youtube and quiz only apply to notecontent ${notecontentrules}

## 6. CITATION RULES
When answering questions based on the PDF (either from context or the tool):
- Cite your sources inline using brackets like **[1]**, **[2]**.
- If using the \`searchWithPdf\` tool, the tool output will provide these index numbers.

## 7. DOCUMENT CONTENT (PREVIEW)
<PDF_PREVIEW>
${pdfText ? pdfText.slice(0, 50000) : "No text preview available."}
... [Content truncated, use searchWithPdf tool for more]
</PDF_PREVIEW>
`;
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