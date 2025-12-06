import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs,
} from "ai";
import { google, GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import { ConvexClient, ConvexHttpClient } from "convex/browser";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  blockNoteToMarkdown,
  markdownToBlockNote,
} from "@/lib/convertmarkdowntoblock";
import {
  CreateFolderOutput,
  CreateNoteOutput,
  CreateWhiteboardOutput,
  GenerateCodeSnippetOutput,
  GenerateFlashcardOutput,
  GenerateMermaidDiagramOutput,
  GetFlashcardOutput,
  GetFolderItemsOutput,
  GetUserFlashcardsOutput,
  SearchWebOutput,
  SearchWithPdfOutput,
  UpdateFolderOutput,
  UpdateNoteOutput,
  YoutubeVideoOutput,
} from "@/types/aitoolstypes";
import { query } from "@/convex/_generated/server";
import { BlockContentSchema, blocksSchema, convertSchemaToBlockNote, NoteStructureSchema } from "@/lib/ai-block-parser";

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    webSearch,
    contextFolder,
    convexToken,
    contextNote,
    studyMode,
    thinking,
  }: {
    messages: UIMessage[];
    webSearch?: boolean;
    contextFolder?: Doc<"folders">[];
    convexToken?: string;
    contextNote?: Doc<"notes">[];
    studyMode?: boolean;
    thinking?: boolean;
  } = await req.json();

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  if (convexToken) {
    convex.setAuth(convexToken);
  } else {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
    });
  }

  const folderContext =
    contextFolder && contextFolder.length > 0
      ? `Tagged Folders: ${contextFolder.map((f) => `"${f.name}" (ID: ${f._id})`).join(", ")}`
      : `No folders are currently tagged.`;
  console.log("folderContext", folderContext);

  // Build context string for tagged notes
  const noteContext =
    contextNote && contextNote.length > 0
      ? `Tagged Notes: ${contextNote.map((n) => `"${n.title}" (ID: ${n._id})`).join(", ")}`
      : `No notes are currently tagged.`;
  console.log("noteContext", noteContext);

  // Build a string for the study mode
  const studyModeContext = studyMode
    ? "ACTIVE (Tutor Mode)"
    : "INACTIVE (Assistant Mode)";
  console.log("studyModeContext", studyModeContext);

  // Build a string for web search
  const webSearchContext = webSearch ? "ENABLED" : "DISABLED";
  console.log("webSearchContext", webSearchContext);

  const userInfo = await convex.query(api.user.getCurrentUser);



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
  const system = `
## 1. CORE ROLE
You are an expert AI study assistant and tutor. Your goal is to help students learn effectively using a variety of multimodal tools (Visuals, Videos, Notes, Quizzes).

## 2. SESSION CONTEXT
- **Study Mode**: ${studyModeContext}
- **Web Search**: ${webSearchContext}
- ${folderContext}
- ${noteContext}
- The user's name is ${userInfo.name} use it when addressing the user

## 3. DECISION ENGINE (HOW TO CHOOSE TOOLS)
When the user asks a question, pause and decide the best pedagogical approach:

| User Intent | Best Tool | Why? |
| :--- | :--- | :--- |
| "Visualize", "Map out", "Flow of..." | \`generateMermaidDiagram\` | Visuals help memory retention for processes and structures. |
| "Watch a video", "Tutorial for..." | \`youtubeVideo\` | Some concepts are best learned through watching. |
| "Quiz me", "Test me" | \`getUserFlashcards\` (then quiz) OR \`generateFlashcards\` | Active recall is the best way to study. |
| "Save this", "Write a note" | \`createNote\` | Helps the user organize knowledge for later. |
| "Show me code", "How to implement" | \`generateCodeSnippet\` | Provides syntax highlighting and copy-paste ability. |
| "Current events", "Fact check" | \`searchTheWeb\` | Your internal knowledge cutoff might be outdated. |

## 4. MODE BEHAVIOR
${studyMode ? `
### 🎓 TUTOR MODE (ACTIVE)
- **Socratic Method**: Do not dump answers. Ask guiding questions.
- **Proactive Visuals**: If a concept is complex (e.g. "Krebs Cycle", "Redux Flow"), AUTO-GENERATE a diagram without being asked.
- **Check Understanding**: After explaining, ask "Would you like a quick quiz on this?"
` : `
### 🤖 ASSISTANT MODE (ACTIVE)
- **Direct & Efficient**: Give the complete answer immediately.
- **Get it done**: If asked for flashcards, generate them instantly.
`}

## 5. SPECIFIC TOOL INSTRUCTIONS

### 🎨 Diagrams (Mermaid)
- **Flowcharts**: For processes, decision trees, or logic loops.
- **Sequence**: For interactions between actors (User -> API -> DB).
- **Mindmaps**: For brainstorming or hierarchical topic breakdowns.
- **ER**: For database schemas.
- **Class Diagrams**: For object-oriented design.
- 
- **IMPORTANT**: Output VALID Mermaid syntax. Do not wrap the code in markdown blocks inside the tool call.

### 📺 YouTube
- Use this when the user is stuck or asks for a visual explanation or to explain the concept better .
- If you find a video, briefly summarize *why* it's helpful before showing it.

### 📝 Notes
- Title: Auto-generate a descriptive title (e.g., "Summary of Quantum Mechanics").
- Content: ${notecontentrules}.

### 🃏 Flashcards
- **Autonomy**: Do not ask the user for questions. Analyze the context (notes/folders) or any other available information and generate 5-10 high-quality cards.
- **Format**: For MCQ, ensure one answer is clearly correct and distractors are plausible.

### 🌐 Web Search
- Use this for: News, Citations, Recent Libraries/Frameworks, or when you are unsure.
- **Citations**: If you use search results, cite them in your text response using [1], [2] format corresponding to the source order.
## Your Output Format Rules:
## 2. STANDARD OPERATING PROCEDURES (SOP)

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
1. **Fetch**: Call \`getNoteContent\` to read the current text (it returns Markdown).if you see @youtube[] that is a youtube video link or @quiz[] that is a quiz block (it is how the function converts blocknote to markdown for you dont use the symbols anywhere they are for you) .
2. **Update**: Update the note using the \`updateNote\` tool.
`;

  const tools = createTools(convex);

  const result = streamText({
    model:google('gemini-2.5-pro'),
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
    onFinish: async ({ usage }) => {
      const { totalTokens, inputTokens, outputTokens } = usage;
      await convex.mutation(api.subscriptions.trackAiTokenUsage, {
        tokens: totalTokens as number,
      });
      console.log("Total tokens:", totalTokens);
    },
  });
  console.log(result.response)
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
}

export function createTools(convex: ConvexHttpClient) {
  return {
    generateFlashcards: tool({
      description:
        "Generate a flashcard in a folder For multiple choice, provide 4 options.",
      inputSchema: z.object({
        folderId: z
          .string()
          .describe("The folder ID where the flashcard should be created"),
        question: z
          .string()
          .describe(
            "The question to ask (you generate this based on folder content)"
          ),
        answers: z
          .array(
            z.object({
              text: z.string().describe("Answer option text"),
              isCorrect: z.boolean().describe("Whether this answer is correct"),
            })
          )
          .describe(
            "Array of possible answers. For multiple choice: 4 options with 1 correct. For true/false: 2 options."
          ),
        isMultipleChoice: z
          .boolean()
          .describe(
            "True for multiple choice questions, false for true/false or short answer"
          ),
      }),
      execute: async ({
        folderId,
        question,
        answers,
        isMultipleChoice,
      }): Promise<
        GenerateFlashcardOutput | { success: false; error: string }
      > => {
        try {
          const flashcard = await convex.mutation(
            api.flashcards.createFlashcard,
            {
              folderId: folderId as Id<"folders">,
              question: question,
              answers: answers,
              isMultipleChoice: isMultipleChoice,
            }
          );
          console.log("success in generateFlashcards");
          console.log('used generateFlashcards tool')
          return {
            success: true,
            flashcard: flashcard,
            message: `Created flashcard: "${question}"`,
          };
        } catch (error) {
          console.log("error in generateFlashcards", error);
          return {
            success: false,
            error: `Failed to create flashcard: ${error}`,
          };
        }
      },
    }),

    getUserFlashcards: tool({
      description:
        "Retrieve all flashcards from a specific folder. Use this to  understand what flashcards already exist.",
      inputSchema: z.object({
        folderId: z.string().describe("The folder ID to fetch flashcards from"),
      }),
      execute: async ({
        folderId,
      }): Promise<
        GetUserFlashcardsOutput | { success: false; error: string }
      > => {
        try {
          const flashcards = await convex.query(
            api.flashcards.fetchFlashcards,
            {
              folderId: folderId as Id<"folders">,
            }
          );
          console.log("success in getUserFlashcards");
          console.log('used getUserFlashcards tool')
          return {
            success: true,
            flashcards,
            count: flashcards?.length || 0,
          };
        } catch (error) {
          console.log("error in getUserFlashcards", error);
          return {
            success: false,
            error: `Failed to fetch flashcards: ${error}`,
          };
        }
      },
    }),

    getfolderitems: tool({
      description:
        "Get all content (notes, files, flashcards) from a folder. ALWAYS call this FIRST before generating new content to understand the context.",
      inputSchema: z.object({
        folderId: z.string().describe("The folder ID to fetch content from"),
      }),
      execute: async ({
        folderId,
      }): Promise<GetFolderItemsOutput | { success: false; error: string }> => {
        try {
          const [notes, files, flashcards] = await Promise.all([
            convex.query(api.notes.fetchNotesInFolder, {
              folderId: folderId as Id<"folders">,
            }),
            convex.query(api.files.fetchfiles, {
              folderId: folderId as Id<"folders">,
            }),
            convex.query(api.flashcards.fetchFlashcards, {
              folderId: folderId as Id<"folders">,
            }),
          ]);
          console.log("success in getfolderitems");
          console.log('used getfolderitems tool')
          return {
            success: true,
            notes: notes || [],
            files: files || [],
            flashcards: flashcards || [],
            summary: `Found ${notes?.length || 0} notes, ${files?.length || 0} files, and ${flashcards?.length || 0} flashcards`,
          };
        } catch (error) {
          console.log("getfolderitems error", error);
          return {
            success: false,
            error: `Failed to fetch folder items: ${error}`,
          };
        }
      },
    }),

    createNote: tool({
      description:
        'Create a new note with a title and content  . You should generate an appropriate title based on the topic (e.g., "Introduction to Machine Learning", "Chapter 3 Summary"). DO NOT ask the user for a title if they have provided a topic .',
      inputSchema: z.object({
        folderId: z
          .string()
          .describe("The folder ID where the note should be created"),
        title: z.string().describe("Note title"),
        content: blocksSchema,
      }),
      execute: async ({
        folderId,
        title,
        content,
      }): Promise<CreateNoteOutput | { success: false; error: string }> => {
        try {
          const blocks = convertSchemaToBlockNote(content);
          console.log('=== STRUCTURED INPUT ===');
          console.log(JSON.stringify(content, null, 2));
          console.log('=== BLOCKNOTE OUTPUT ===');
          console.log(blocks);
          const note = await convex.mutation(api.notes.createNote, {
            folderId: folderId as Id<"folders">,
            title: title,
            content: blocks,
          });
          console.log("created note", note);
          console.log('used createNote tool')
          return {
            success: true,
            note: note,
            message: `Created note: "${title}"`,
          };
        } catch (error) {
          console.log("note creation error", error);
          return {
            success: false,
            error: `Failed to create note: ${error}`,
          };
        }
      },
    }),

    updateNote: tool({
      description:
        "Update the content of an existing note",
      inputSchema: z.object({
        noteId: z.string().describe("The note ID to update"),
        content: blocksSchema,
      }),
      execute: async ({
        noteId,
        content,
      }): Promise<UpdateNoteOutput | { success: false; error: string }> => {
        try {
          console.log('=== STRUCTURED INPUT ===');
          console.log(JSON.stringify(content, null, 2));
          const blockoutput = convertSchemaToBlockNote(content);
          console.log('=== BLOCKNOTE OUTPUT ===');
          console.log(blockoutput);
          const note = await convex.mutation(api.notes.updateContent, {
            noteId: noteId as Id<"notes">,
            content: blockoutput,
          });
          console.log("updated note", note);
          console.log('used updateNote tool')
          return {
            success: true,
            note: note,
            message: `Note content updated successfully`,
          };
        } catch (error) {
          console.log("note update error", error);
          return {
            success: false,
            error: `Failed to update note: ${error}`,
          };
        }
      },
    }),
    getNoteContent: tool({
      description: "Get the content of a specific note",
      inputSchema: z.object({
        noteId: z.string().describe("The note ID to fetch"),
      }),
      execute: async ({ noteId }) => {
        try {
          const note = await convex.query(api.notes.getNoteId, {
            noteId: noteId as Id<"notes">,
          });

          if (note.content === undefined) {
            return { success: false, error: "Note content not found" };
          }
          const markdown = blockNoteToMarkdown(note.content);
          console.log('used getnotecontent tool')
          return { success: true, markdown };
        } catch (error) {
          console.log("note content error", error);
          return {
            success: false,
            error: `Failed to get note content: ${error}`,
          };
        }
      },
    }),

    getFlashcard: tool({
      description:
        "Get detailed information about a specific flashcard including its question, answers, and performance statistics.",
      inputSchema: z.object({
        flashcardId: z.string().describe("The flashcard ID to fetch"),
      }),
      execute: async ({
        flashcardId,
      }): Promise<GetFlashcardOutput | { success: false; error: string }> => {
        try {
          const flashcard = await convex.query(api.flashcards.getFlashcard, {
            flashcardId: flashcardId as Id<"flashcards">,
          });
          console.log('used getFlashcard tool')
          return {
            success: true,
            flashcard: flashcard,
          };
        } catch (error) {
          return {
            success: false,
            error: `Failed to fetch flashcard: ${error}`,
          };
        }
      },
    }),

    // google_search: google.tools.googleSearch({}),
    searchTheWeb: tool({
      description: "Search the web for recent information on a topic. Use this for any current events, facts, or questions that your internal knowledge does not cover.",
      inputSchema: z.object({
        query: z.string().describe("The search query to find information about."),
      }),
      execute: async ({ query }): Promise<SearchWebOutput | { success: false; error: string }> => {
        console.log(`Tool: searching web for: ${query}`);
        try {
          const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
          const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
          const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}`;

          const response = await fetch(url);
          if (!response.ok) {
            return { success: false, error: "Failed to fetch search results" };
          }

          const data = await response.json();
          console.log('used searchTheWeb tool')
          // Extract snippets and sources
          const results = data.items?.map((item: any) => ({
            content: item.snippet,
            url: item.link,
            title: item.title,
          })) || [];

          if (results.length === 0) {
            return { success: true, message: "No relevant web results found." ,resultsContext: "", sources: []};
          }

          // Return a clean, simple string for the LLM
          const context = results
            .slice(0, 5) // Get top 5 results
            .map((item: any) => `Title: ${item.title}\nSource: ${item.url}\nContent: ${item.content}`)
            .join('\n\n---\n\n');

          return {
            success: true,
            message: `Found ${results.length} results.`,
            resultsContext: context,
            sources: results.slice(0, 5)          
          };

        } catch (error) {
          console.error("Error in searchTheWeb:", error);
          return { success: false, error: `Failed to execute search: ${error}` };
        }
      }
    }),
    createFolder: tool({
      description: "Create a new folder with a name and optional description.",
      inputSchema: z.object({
        name: z.string().describe("The name of the folder based on the topic"),
        description: z
          .string()
          .optional()
          .describe("Optional description of the folder"),
      }),
      execute: async ({
        name,
        description,
      }): Promise<CreateFolderOutput | { success: false; error: string }> => {
        try {
          const folder = await convex.mutation(api.folders.createFolder, {
            name,
            description,
          });
          console.log("created folder", folder);
          console.log('used createFolder tool')
          return {
            success: true,
            folder,
            message: `Created folder: "${name}"`,
          };
        } catch (error) {
          console.log("folder creation error", error);
          return { success: false, error: `Failed to create folder: ${error}` };
        }
      },
    }),
    updateFolder: tool({
      description: "Update the name and description of an existing folder.",
      inputSchema: z.object({
        folderId: z.string().describe("The folder ID to update"),
        name: z.string().optional().describe("The new name for the folder"),
        description: z
          .string()
          .optional()
          .describe("The new description for the folder"),
      }),
      execute: async ({
        folderId,
        name,
        description,
      }): Promise<UpdateFolderOutput | { success: false; error: string }> => {
        try {
          const folder = await convex.mutation(api.folders.updateFolder, {
            folderId: folderId as Id<"folders">,
            name,
            description,
          });
          console.log("updated folder", folder);
          console.log('used updateFolder tool')
          return { success: true, message: `Updated folder: "${name}"` };
        } catch (error) {
          console.log("folder update error", error);
          return { success: false, error: `Failed to update folder: ${error}` };
        }
      },
    }),

    generateCodeSnippet: tool({
      description:
        "Generate a code snippet. Use this when the user asks for code examples, algorithms, or solutions. This renders a nice code editor in the UI.",
      inputSchema: z.object({
        title: z
          .string()
          .describe(
            'Short title for the snippet, e.g., "Dijkstra Implementation"'
          ),
        language: z
          .string()
          .describe(
            'Programming language, e.g., "python", "typescript", "react"'
          ),
        code: z.string().describe("The actual code content"),
        description: z
          .string()
          .optional()
          .describe("Brief explanation of what the code does"),
      }),
      execute: async ({
        title,
        language,
        code,
        description,
      }): Promise<
        GenerateCodeSnippetOutput | { success: false; error: string }
      > => {
        return {
          success: true,
          title,
          language,
          code,
          description,
        };
      },
    }),

    generateMermaidDiagram: tool({
      description:
        "Generate a Mermaid diagram for visualizing concepts, processes, or relationships. Use this to create flowcharts, sequence diagrams, class diagrams, etc.",
      inputSchema: z.object({
        title: z.string().describe("Title for the diagram"),
        diagramType: z.enum([
          "flowchart",
          "sequence",
          "class",
          "state",
          "er",
          "gantt",
          "pie",
          "mindmap",
          "xy",
          'block',
        ]),
        diagram: z.string().describe("The Mermaid diagram code"),
        description: z.string().optional().describe("Brief explanation"),
      }),
      execute: async ({
        title,
        diagramType,
        diagram,
        description,
      }): Promise<
        GenerateMermaidDiagramOutput | { success: false; error: string }
      > => {
        try {
          if (!diagram.trim()) {
            return { success: false, error: "Diagram code cannot be empty" };
          }
          console.log("used diagram", diagram);
          return {
            success: true,
            title,
            diagram,
            description:
              description || `${diagramType} diagram showing ${title}`,
          };
        } catch (error) {
          console.log("error in generateMermaidDiagram", error);
          return {
            success: false,
            error: `Failed to generate diagram: ${error}`,
          };
        }
      },
    }),
    youtubeVideo: tool({
  description: "Search for a YouTube video and play it. Use this when the user asks for a video tutorial or visual explanation.",
  inputSchema: z.object({
    query: z.string().describe("Search query for YouTube (e.g., 'Pythagoras theorem tutorial')"),
  }),
  execute: async ({ query }): Promise<YoutubeVideoOutput | { success: false; error: string }> => {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    // We append 'site:youtube.com' to ensure we get video links
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query + " site:youtube.com")}&num=1`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      const firstResult = data.items?.[0];

      if (!firstResult) return { success: false, error: "No video found" };

      // Extract Video ID from URL (e.g., ?v=dQw4w9WgXcQ)
      const videoIdMatch = firstResult.link.match(/(?:v=|\/)([\w-]{11})(?:\?|&|\/|$)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;

      if (!videoId) return { success: false, error: "Could not parse Video ID" };

      return { 
        success: true, 
        videoId, 
        title: firstResult.title, 
        description: firstResult.snippet 
      };
    } catch (e) {
      return { success: false, error: "YouTube search failed" };
    }
  }
}),

     searchWithPdf:tool({
      description:'Search inside a specific PDF file to find relevant context/answers. Use this when the user asks questions about a document they have uploaded.',
      inputSchema:z.object({
        query:z.string().describe("Search query for PDF"),
        fileId: z.string().describe("The ID of the PDF file to search"),
      }),
      execute: async({query,fileId}):Promise<SearchWithPdfOutput | { success: false; error: string }>=>{
        try {
       // 1. Get the raw response from Convex
      const searchResponse = await convex.action(api.rag.search, {
         query,
         fileId: fileId as Id<"files">,
      });


      // 2. Safety Check: Did we get results?
      // The structure is searchResponse.results
      if (!searchResponse?.results || searchResponse.results.length === 0) {
         return { success: true, resultsContext: "No relevant info found." };
      }

      // 3. Map over 'results' to extract text correctly
      // We limit to top 5 to save tokens
      const hits = searchResponse.results.slice(0, 5);

      const contextString = hits
        .map((result: any, i: number) => {
           
           const textContent = result.content?.[0]?.text || "";
           return `[${i + 1}] "${textContent.trim()}"`;
        })
        .join("\n\n");

      const sources = hits.map((result: any) => {
       
        const textContent = result.content?.[0]?.text || "";
        return {
          pageContent: textContent,
          metadata: { 
             score: result.score 
             // Note: my  current data doesn't have explicit 'pageNumber' metadata, 
             // but it is written inside the text (e.g. "-- 1 of 14 --")
          }
        };
      });

      console.log("sources", sources);
      console.log("contextString", contextString);
      return {
        success: true,
        resultsContext: `Relevant PDF Excerpts:\n\n${contextString}`,
        sources: sources
      };
        } catch (error) {
          console.log("error in searchWithPdf", error);
          return { success: false, error: `Failed to search with PDF: ${error}` };
        }
      }
     })

     
  };
}
