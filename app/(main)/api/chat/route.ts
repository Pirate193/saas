import { streamText, UIMessage, convertToModelMessages, tool, stepCountIs } from "ai";
import { google } from '@ai-sdk/google';
import { ConvexClient, ConvexHttpClient } from "convex/browser";
import { z } from 'zod';
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { title } from "process";


// Allow streaming responses up to 30 seconds
export const maxDuration = 30;


export async function POST(req: Request) {
  const { messages,contextFolder,convexToken}: {messages: UIMessage[],contextFolder?:Doc<'folders'>, convexToken?: string } = await req.json();
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  
  if (convexToken) {
    convex.setAuth(convexToken);
  } else {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }), 
      { status: 401 }
    );
  }
  const contextSection = contextFolder 
    ? `
CURRENT CONTEXT:
- The user has selected the folder: "${contextFolder.name}" (ID: ${contextFolder._id})
- Description: ${contextFolder.description || 'No description provided'}
- When the user asks you to generate flashcards, notes, or work with content, use THIS folder by default
- ALWAYS call getfolderitems tool first to understand what's already in this folder before generating new content
`
    : `
CURRENT CONTEXT:
- No folder is currently selected
- If the user asks to generate content, politely ask them to select a folder using the @ button
`;

  const system = `You are an expert AI study assistant and tutor for students. Your goal is to help students learn effectively and achieve academic success.

${contextSection}

YOUR CORE CAPABILITIES:
1. **Content Understanding**: Analyze and explain concepts from their notes, files, and flashcards
2. **Active Learning**: Create study plans, quizzes, and practice questions
3. **Flashcard Mastery**: Quiz students on their flashcards, provide detailed feedback
4. **Note Enhancement**: Suggest improvements to their notes, identify gaps
5. **Study Strategies**: Provide personalized study techniques
6. **Exam Preparation**: Help create study guides, practice tests, and review sessions

CRITICAL TOOL USAGE INSTRUCTIONS:

**When generating flashcards:**
1. FIRST call getfolderitems with the current folder ID to see what content exists
2. Analyze the notes, files, and existing flashcards
3. THEN autonomously generate relevant flashcards using generateFlashcards
4. DO NOT ask the user for questions/answers - YOU create them based on the folder content
5. Generate 5-10 flashcards per request unless specified otherwise
6. Make questions clear, concise, and test understanding (not just memorization)
7. For multiple choice, provide 4 options with only 1 correct answer
8. For true/false or short answer, set isMultipleChoice to false

**When creating notes:**
1. FIRST call getfolderitems to understand existing content
2. Generate an appropriate title based on the topic (e.g., "Introduction to AI", "Photosynthesis Overview")
3. Call createNote with folderId and your generated title
4. THEN call updateNote with substantial, well-structured content
5. DO NOT ask the user for a title - YOU create one based on their request

**When quizzing:**
1. Call getUserFlashcards to get existing flashcards
2. Present questions one at a time
3. Wait for answers and provide detailed feedback

**General Rules:**
- Be proactive and autonomous - don't ask for information you can generate yourself
- Use tools in the right sequence (always get context first)
- If a folder is selected, assume the user wants to work with that folder
- Only ask clarifying questions if the request is genuinely ambiguous (e.g., "generate flashcards" without specifying the subject when the folder has multiple topics)

HOW TO INTERACT:
- **Be Encouraging**: Celebrate progress and provide constructive feedback
- **Be Socratic**: Ask guiding questions to help students think critically (but don't ask for data you should generate)
- **Be Adaptive**: Adjust your teaching style based on responses
- **Be Specific**: Reference their actual content when helping
- **Be Concise**: Keep responses focused (2-3 paragraphs unless explaining complex topics)
- **Be Autonomous**: Take initiative - if asked to "generate flashcards about AI", just do it!

STUDY SESSION MODES:
1. **Quiz Mode**: Interactive study sessions using their flashcards
2. **Explain Mode**: Break down concepts with examples and analogies
3. **Review Mode**: Summarize key concepts and create practice questions
4. **Brainstorm Mode**: Help organize thoughts and provide structure

Remember: You are a PROACTIVE assistant. When asked to generate content, do it autonomously. Don't make the user do your job!`;
const tools = createTools(convex);

  const result = streamText({
    model:google('gemini-2.5-flash') ,
    messages: convertToModelMessages(messages),
    system:system,
    tools,
    stopWhen:stepCountIs(10)
  });

  console.log('result', result);
  // send sources and reasoning back to the client
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });

}

function createTools(convex: ConvexHttpClient) {
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
    execute: async ({ folderId, question, answers, isMultipleChoice }) => {
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
          flashcard,
          message: `Created flashcard: "${question}"` 
        };
      } catch (error) {
         console.log('error in generateFlashcards',error);
        return { 
          success: false, 
          error: `Failed to create flashcard: ${error}` 
        };
      }
    }
  }),
  
  getUserFlashcards: tool({
    description: 'Retrieve all flashcards from a specific folder. Use this to quiz the user or understand what flashcards already exist.',
    inputSchema: z.object({
      folderId: z.string().describe('The folder ID to fetch flashcards from'),
    }),
    execute: async ({ folderId }) => {
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
         console.log('errorin getUserFlashcards',error);
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
    execute: async ({ folderId }) => {
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
         console.log('getfolderitems', error);
        return { 
          success: false, 
          error: `Failed to fetch folder items: ${error}` 
        };
      }
    }
  }),
  
  createNote: tool({
    description: 'Create a new note with a title. You should generate an appropriate title based on the topic (e.g., "Introduction to Machine Learning", "Chapter 3 Summary"). DO NOT ask the user for a title.',
    inputSchema: z.object({
      folderId: z.string().describe('The folder ID where the note should be created'),
      title: z.string().describe('The title for the note (you generate this based on the topic)'),
    }),
    execute: async ({ folderId, title }) => {
      try {
        const note = await convex.mutation(api.notes.createNote, {
          folderId: folderId as Id<'folders'>,
          title: title,
        });
          console.log('created note', note);
        return { 
          success: true, 
          note,
          message: `Created note: "${title}". Now update it with content using updateNote.` 
        };
      
      } catch (error) {
        console.log('note creation', error);
        return { 
          success: false, 
          error: `Failed to create note: ${error}` 
        };
      }
    }
  }),
  
  updateNote: tool({
    description: 'Update the content of an existing note. Use this after createNote to add substantial, well-structured content.',
    inputSchema: z.object({
      noteId: z.string().describe('The note ID to update'),
      content: z.string().describe('The full content to add to the note'),
    }),
    execute: async ({ noteId, content }) => {
      try {
        const note = await convex.mutation(api.notes.updateContent, {
          noteId: noteId as Id<'notes'>,
          content: content,
        });
        console.log('updated ', note);
        return { 
          success: true, 
          note,
          message: `Note content updated successfully ${note} ` 
        };
        
      } catch (error) {
         console.log('note update', error);
        return { 
          success: false, 
          error: `Failed to update note: ${error}` 
        };
      }
    }
  }),
  getFlashcard: tool({
   description: 'Get detailed information about a specific flashcard including its question, answers, and performance statistics. Use this to understand how the student is performing on specific flashcards.',
      inputSchema: z.object({
        flashcardId: z.string().describe('The flashcard ID to fetch'),
      }),
      execute: async ({ flashcardId }) => {
        try {
          const flashcard = await convex.query(api.flashcards.getFlashcard, {
            flashcardId: flashcardId as Id<'flashcards'>,
          });
          
          const successRate = flashcard.totalReviews > 0
            ? Math.round((flashcard.correctReviews / flashcard.totalReviews) * 100)
            : 0;
          
          return {
            success: true,
            flashcard,
            stats: {
              successRate: `${successRate}%`,
              totalReviews: flashcard.totalReviews,
              correctReviews: flashcard.correctReviews,
              isStruggling: successRate < 50 && flashcard.totalReviews >= 3,
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Failed to fetch flashcard: ${error}`,
          };
        }
      }
  })
}
}