import { streamText, UIMessage, convertToModelMessages, tool, stepCountIs } from "ai";
import { google, GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';
import { ConvexClient, ConvexHttpClient } from "convex/browser";
import { z } from 'zod';
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { blockNoteToMarkdown, markdownToBlockNote } from "@/lib/convertmarkdowntoblock";
import { CreateFolderOutput, CreateNoteOutput, GenerateCodeSnippetOutput, GenerateFlashcardOutput, GetFlashcardOutput, GetFolderItemsOutput, GetUserFlashcardsOutput, UpdateFolderOutput, UpdateNoteOutput } from "@/types/aitoolstypes";


export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages,webSearch, contextFolder, convexToken, contextNote, studyMode, thinking }: { 
    messages: UIMessage[], 
    webSearch?: boolean,
    contextFolder?: Doc<'folders'>[], 
    convexToken?: string ,
    contextNote?: Doc<'notes'>[],
    studyMode?: boolean,
    thinking?: boolean,
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
    ? `Tagged Folders: ${contextFolder.map(f => `"${f.name}" (ID: ${f._id})`).join(', ')}`
    : `No folders are currently tagged.`;
  console.log('folderContext',folderContext)

  // Build context string for tagged notes
  const noteContext = (contextNote && contextNote.length > 0)
    ? `Tagged Notes: ${contextNote.map(n => `"${n.title}" (ID: ${n._id})`).join(', ')}`
    : `No notes are currently tagged.`;
    console.log('noteContext',noteContext)

  // Build a string for the study mode
  const studyModeContext = studyMode ? 'ACTIVE (Tutor Mode)' : 'INACTIVE (Assistant Mode)';
  console.log('studyModeContext',studyModeContext)
  
  // Build a string for web search
  const webSearchContext = webSearch ? 'ENABLED' : 'DISABLED';
  console.log('webSearchContext',webSearchContext)

  const userInfo = await convex.query(api.user.getCurrentUser)

  // --- (This is the new System Prompt) ---
  const system = `
## 1. CORE ROLE
You are an expert AI study assistant. Your primary goal is to help students learn effectively and achieve academic success. Your behavior changes based on the active mode.

## 2. SESSION CONFIGURATION
- **Study Mode**: ${studyModeContext}
- **Web Search**: ${webSearchContext}
- ${folderContext}
- ${noteContext}
- ${userInfo}

## 3. MODE-SPECIFIC BEHAVIOR
${studyMode ? `
### TUTOR MODE (STUDY MODE IS ON)
You are an interactive, Socratic tutor. Your goal is to guide the student to their own understanding.
- **NEVER** give a direct, final answer to a knowledge question (e.g., "What is machine learning?").
- **ALWAYS** respond by:
  1.  Acknowledging their question.
  2.  Asking a smaller, guiding question to help them think.
  3.  Breaking the concept into digestible steps.
- **Example:**
  - *User:* "What is machine learning?"
  - *You:* "That's a great topic! To start, what do you already know about how computers make decisions? For example, have you heard of 'if-then' rules?"
- Proactively use tools. If a student is learning, call \`getfolderitems\` to see if they have notes, then call \`getUserFlashcards\` to quiz them. This is a core part of guided learning.
` : `
### ASSISTANT MODE (STUDY MODE IS OFF)
You are a direct, efficient AI assistant. Your goal is to provide comprehensive, factual answers quickly.
- **ALWAYS** provide a direct, complete answer to the user's question.
- Use clear formatting (headings, lists) to make information easy to digest.
- Be autonomous: if asked to "create flashcards," do it immediately using your own knowledge and the provided context.
`}

## 4. CRITICAL TOOL USAGE
- **AUTONOMY (MANDATORY)**: You are fully autonomous. When asked to generate content (flashcards, notes), you MUST generate it yourself based on the context. **NEVER** ask the user to provide the questions, answers, or content.
- **CONTEXT FIRST**: Before generating *any* new content, **ALWAYS** call \`getfolderitems\` on a tagged folder to see what notes, files, and flashcards already exist. This prevents duplication and provides context.
- **WEB SEARCH**: ${webSearch ? 'Use the \`searchTheWeb\` tool if the user asks for current events or information you cannot find in the chat history or tagged context.' : 'You do not have access to the web. Only use your internal knowledge.'}

## 5. SPECIFIC TOOL INSTRUCTIONS
### Generating Code Snippets:
1.  Use \`generateCodeSnippet\` to generate a code snippet.
### Generating Flashcards:
1.  Call \`getfolderitems\` on the relevant folder.
2.  Analyze existing notes, files, and flashcards.
3.  Autonomously generate 5-10 new, relevant flashcards using \`generateFlashcards\`.
4.  Questions must be clear and test understanding. For multiple choice, provide 4 options with only 1 correct answer.
### Creating Notes:
1.  Call \`getfolderitems\` to understand existing content.
2.  Autonomously generate an appropriate title (e.g., "Introduction to AI").
3.  Call \`createNote\` with the \`folderId\` and your generated \`title\` and \`content\` in markdown format when creating a note always make sure it has content  .
4.   call \`updateNote\` with the new \`noteId\` and the full note content.
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

  const tools = createTools(convex);

  const result = streamText({
    model: thinking ? google('gemini-2.5-pro') : google('gemini-2.5-flash'),
    messages: convertToModelMessages(messages),
    system: system,
    providerOptions:{
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
      const {totalTokens,inputTokens,outputTokens } = usage;
      await convex.mutation(api.subscriptions.trackAiTokenUsage,{tokens:totalTokens as number})
      console.log('Total tokens:', totalTokens);
    },
  });

  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
}

export function createTools(convex: ConvexHttpClient) {
  return {
    generateFlashcards: tool({
      description: 'Generate a flashcard in a folder. Create thoughtful questions with correct answers based on the folder content. For multiple choice, provide 4 options. DO NOT ask the user for questions/answers - you should generate them autonomously.',
      inputSchema: z.object({
        folderId: z.string().describe('The folder ID where the flashcard should be created'),
        question: z.string().describe('The question to ask (you generate this based on folder content)'),
        answers: z.array(z.object({
          text: z.string().describe('Answer option text'),
          isCorrect: z.boolean().describe('Whether this answer is correct')
        })).describe('Array of possible answers. For multiple choice: 4 options with 1 correct. For true/false: 2 options.'),
        isMultipleChoice: z.boolean().describe('True for multiple choice questions, false for true/false or short answer'),
      }),
      execute: async ({ folderId, question, answers, isMultipleChoice }):Promise<GenerateFlashcardOutput | { success: false, error: string }> => {
        try {
          const flashcard = await convex.mutation(api.flashcards.createFlashcard, {
            folderId: folderId as Id<'folders'>,
            question: question,
            answers: answers,
            isMultipleChoice: isMultipleChoice,
          });
          console.log('success in generateFlashcards');
          return { 
            success: true, 
            flashcard:flashcard,
            message: `Created flashcard: "${question}"` 
          };
        } catch (error) {
          console.log('error in generateFlashcards', error);
          return { 
            success: false, 
            error: `Failed to create flashcard: ${error}` 
          };
        }
      }
    }),
    
    getUserFlashcards: tool({
      description: 'Retrieve all flashcards from a specific folder. Use this to  understand what flashcards already exist.',
      inputSchema: z.object({
        folderId: z.string().describe('The folder ID to fetch flashcards from'),
      }),
      execute: async ({ folderId }):Promise<GetUserFlashcardsOutput | { success: false, error: string }> => {
        try {
          const flashcards = await convex.query(api.flashcards.fetchFlashcards, {
            folderId: folderId as Id<'folders'>,
          });
          console.log('success in getUserFlashcards');
          return { 
            success: true, 
            flashcards,
            count: flashcards?.length || 0 
          };
        } catch (error) {
          console.log('error in getUserFlashcards', error);
          return { 
            success: false, 
            error: `Failed to fetch flashcards: ${error}` 
          };
        }
      }
    }),
    
    getfolderitems: tool({
      description: 'Get all content (notes, files, flashcards) from a folder. ALWAYS call this FIRST before generating new content to understand the context.',
      inputSchema: z.object({
        folderId: z.string().describe('The folder ID to fetch content from'),
      }),
      execute: async ({ folderId }):Promise<GetFolderItemsOutput | { success: false, error: string }> => {
        try {
          const [notes, files, flashcards] = await Promise.all([
            convex.query(api.notes.fetchNotesInFolder, {
              folderId: folderId as Id<'folders'>,
            }),
            convex.query(api.files.fetchfiles, {
              folderId: folderId as Id<'folders'>,
            }),
            convex.query(api.flashcards.fetchFlashcards, {
              folderId: folderId as Id<'folders'>,
            }),
          ]);
          console.log('success in getfolderitems');
          return { 
            success: true,
            notes: notes || [],
            files: files || [],
            flashcards: flashcards || [],
            summary: `Found ${notes?.length || 0} notes, ${files?.length || 0} files, and ${flashcards?.length || 0} flashcards`
          };
        } catch (error) {
          console.log('getfolderitems error', error);
          return { 
            success: false, 
            error: `Failed to fetch folder items: ${error}` 
          };
        }
      }
    }),
    
    createNote: tool({
      description: 'Create a new note with a title and content in markdown format . You should generate an appropriate title based on the topic (e.g., "Introduction to Machine Learning", "Chapter 3 Summary"). DO NOT ask the user for a title if they have provided a topic .',
      inputSchema: z.object({
        folderId: z.string().describe('The folder ID where the note should be created'),
        title: z.string().describe('The title for the note (you generate this based on the topic)'),
        content: z.string().describe('The content for the note (you generate this based on the topic)in markdown format'),
      }),
      execute: async ({ folderId, title ,content }):Promise<CreateNoteOutput | { success: false, error: string }> => {
        try {
          const blocks = markdownToBlockNote(content);
          const note = await convex.mutation(api.notes.createNote, {
            folderId: folderId as Id<'folders'>,
            title: title,
            content: blocks,
          });
          console.log('created note', note);
          return { 
            success: true, 
            note:note,
            message: `Created note: "${title}".with content "${content}"` 
          };
        } catch (error) {
          console.log('note creation error', error);
          return { 
            success: false, 
            error: `Failed to create note: ${error}` 
          };
        }
      }
    }),
    
    updateNote: tool({
      description: 'Update the content of an existing note. Content MUST be markdown',
      inputSchema: z.object({
        noteId: z.string().describe('The note ID to update'),
        content: z.string().describe('The full content of the note, written in Markdown format. '),
      }),
      execute: async ({ noteId, content }):Promise<UpdateNoteOutput | { success: false, error: string }> => {
        try {
          const blocks = markdownToBlockNote(content);
          const note = await convex.mutation(api.notes.updateContent, {
            noteId: noteId as Id<'notes'>,
            content: blocks,
          });
          console.log('blocks', blocks);
          console.log('updated note', note);
          return { 
            success: true, 
            note:note,
            message: `Note content updated successfully` 
          };
        } catch (error) {
          console.log('note update error', error);
          return { 
            success: false, 
            error: `Failed to update note: ${error}` 
          };
        }
      }
    }),
    getNoteContent:tool({
      description: 'Get the content of a specific note',
      inputSchema:z.object({
        noteId:z.string().describe('The note ID to fetch'),
      }),
      execute: async ({noteId})=>{
        try{
          const note=await convex.query(api.notes.getNoteId,{noteId:noteId as Id<'notes'>})
          
          if(note.content === undefined){
            return {success:false,error:'Note content not found'}
          }
          const markdown = blockNoteToMarkdown(note.content)
          return {success:true,markdown}
        }
        catch(error){
          console.log('note content error',error)
          return {success:false,error: `Failed to get note content: ${error}`}
        }
      }
    }),
    
    getFlashcard: tool({
      description: 'Get detailed information about a specific flashcard including its question, answers, and performance statistics.',
      inputSchema: z.object({
        flashcardId: z.string().describe('The flashcard ID to fetch'),
      }),
      execute: async ({ flashcardId }):Promise<GetFlashcardOutput | { success: false, error: string }> => {
        try {
          const flashcard = await convex.query(api.flashcards.getFlashcard, {
            flashcardId: flashcardId as Id<'flashcards'>,
          });
    
          
          return {
            success: true,
            flashcard:flashcard,
          };
        } catch (error) {
          return {
            success: false,
            error: `Failed to fetch flashcard: ${error}`,
          };
        }
      }
    }),

    searchTheWeb: tool({
      description: "Search the web for recent information on a topic. Use this for any current events, facts, or questions that your internal knowledge does not cover.",
      inputSchema: z.object({
        query: z.string().describe("The search query to find information about."),
      }),
      execute: async ({ query }) => {
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

          // Extract snippets and sources
          const results = data.items?.map((item: any) => ({
            snippet: item.snippet,
            source: item.link,
            title: item.title,
          })) || [];

          if (results.length === 0) {
            return { success: true, message: "No relevant web results found." };
          }

          // Return a clean, simple string for the LLM
          const context = results
            .slice(0, 5) // Get top 5 results
            .map((item: any) => `Title: ${item.title}\nSource: ${item.source}\nSnippet: ${item.snippet}`)
            .join('\n\n---\n\n');

          return { 
            success: true, 
            message: `Found ${results.length} results. Here is the summary of the top 5:`,
            resultsContext: context 
          };
            
        } catch (error) {
          console.error("Error in searchTheWeb:", error);
          return { success: false, error: `Failed to execute search: ${error}` };
        }
      }
    }),
    createFolder:tool({
      description:"Create a new folder with a name and optional description.",
      inputSchema:z.object({
        name:z.string().describe('The name of the folder based on the topic'),
        description:z.string().optional().describe('Optional description of the folder')
      }),
      execute:async({name,description}):Promise<CreateFolderOutput | { success: false, error: string }>=>{
        try{
         const folder = await convex.mutation(api.folders.createFolder,{name,description})
         console.log('created folder',folder)
         return {success:true,folder,message:`Created folder: "${name}"`}
        }
        catch(error){
          console.log('folder creation error',error)
          return {success:false,error: `Failed to create folder: ${error}`}
        }
      }
    }),
    updateFolder:tool({
      description:"Update the name and description of an existing folder.",
      inputSchema:z.object({
        folderId:z.string().describe('The folder ID to update'),
        name:z.string().optional().describe('The new name for the folder'),
        description:z.string().optional().describe('The new description for the folder')
      }),
      execute:async({folderId,name,description}):Promise<UpdateFolderOutput | { success: false, error: string }>=>{
        try{
         const folder = await convex.mutation(api.folders.updateFolder,{folderId:folderId as Id<'folders'>,name,description})
         console.log('updated folder',folder)
         return {success:true,message:`Updated folder: "${name}"`}
        }
        catch(error){
          console.log('folder update error',error)
          return {success:false,error: `Failed to update folder: ${error}`}
        }
      }
    }),

    generateCodeSnippet: tool({
  description: 'Generate a code snippet. Use this when the user asks for code examples, algorithms, or solutions. This renders a nice code editor in the UI.',
  inputSchema: z.object({
    title: z.string().describe('Short title for the snippet, e.g., "Dijkstra Implementation"'),
    language: z.string().describe('Programming language, e.g., "python", "typescript", "react"'),
    code: z.string().describe('The actual code content'),
    description: z.string().optional().describe('Brief explanation of what the code does'),
  }),
  execute: async ({ title, language, code, description }):Promise<GenerateCodeSnippetOutput | { success: false, error: string }> => {
  
    return { 
      success: true, 
      title, 
      language, 
      code, 
      description,
    };
  }
}),
    

  };
}