// lib/ai-block-parser.ts
import { PartialBlock } from "@blocknote/core";
import { randomUUID } from "crypto";
import { z } from "zod";

/**
 * Parses a text string from the AI (e.g., "Hello **bold** and $x^2$")
 * into BlockNote's internal InlineContent structure.
 */
export function parseAIContentToBlockNote(text: string): any[] {
  // 1. Split by Math ($...$) first
  // This regex finds content between single $ signs
  const parts = text.split(/(\$[^\$]+\$)/g);

  return parts.map((part) => {
    // A. Check for Math
    if (part.startsWith("$") && part.endsWith("$")) {
      return {
        type: "math",
        props: {
          latex: part.slice(1, -1), // Remove the $ signs
        },
      };
    }

    // B. Basic Markdown parsing for Bold (**)
    // Note: You can expand this for *italic* if needed, but this is usually enough
    if (part.includes("**")) {
      // This is a simplified parser. For full markdown support inside text, 
      // you could use a library, but this keeps it fast.
      // If the part is "some **bold** text", we just return text with styles for now
      // or return it as plain text if you want to keep it simple.
      // BlockNote can actually import markdown strings directly for content,
      // but let's be explicit for stability:
      return {
        type: "text",
        text: part, // For now, let's treat it as text. BlockNote might auto-parse markdown syntax on paste/load
        styles: {},
      };
    }

    // C. Plain Text
    return {
      type: "text",
      text: part,
      styles: {},
    };
  });
}

/**
 * Maps the AI's Structured JSON response to BlockNote's format
 */
export function mapAIBlocksToBlockNote(aiBlocks: any[]): PartialBlock[] {
  return aiBlocks.map((block: any) => {
    // 1. HEADINGS
    if (block.type === "heading") {
      return {
        type: "heading",
        props: { level: block.level },
        content: parseAIContentToBlockNote(block.text),
      } as PartialBlock;
    }

    // 2. PARAGRAPHS
    if (block.type === "paragraph") {
      return {
        type: "paragraph",
        content: parseAIContentToBlockNote(block.text),
      } as PartialBlock;
    }

    // 3. CODE BLOCKS
    if (block.type === "codeBlock") {
      return {
        type: "codeBlock", // Ensure this matches your editor's code block type
        props: { language: block.language },
        content: block.code, // Code blocks usually take a string content
      } as PartialBlock;
    }

    // 4. CUSTOM: YOUTUBE
    if (block.type === "youtubeVideo") {
      // We ensure the URL is formatted for embed if needed, 
      // but your YoutubeBlock component already handles the logic.
      return {
        type: "youtubeVideo",
        props: {
          videoUrl: block.url,
        },
      }as unknown as PartialBlock;
    }

    // 5. CUSTOM: QUIZ
    if (block.type === "quiz") {
      return {
        type: "quiz",
        props: {
          topic: block.topic,
          isGeneratingInitial: false, // It's already generated!
          // We MUST stringify the array because your QuizBlock expects a stringified prop
          quizzesData: JSON.stringify(block.questions),
        },
      } as unknown as PartialBlock;
    }

    // Fallback
    return {
      type: "paragraph",
      content: "Error: Unknown block type",
    } as PartialBlock;
  });
}
const QuizQuestionSchema = z.object({
  question: z.string().describe("The question text"),
  type: z.enum(["single", "multiple"]).describe("Single or multiple choice"),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  options: z.array(z.string()).min(2).max(6).describe("Answer options"),
  correctAnswers: z.array(z.string()).describe("Correct answer(s) - must match options exactly"),
  explanation: z.string().describe("Detailed explanation of the correct answer")
});

// Schema for block-level content
export const BlockContentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("heading"),
    level: z.enum(["1", "2", "3"]),
    text: z.string()
  }),
  z.object({
    type: z.literal("paragraph"),
    text: z.string()
  }),
  z.object({
    type: z.literal("bulletList"),
    items: z.array(z.string())
  }),
  z.object({
    type: z.literal("numberedList"),
    items: z.array(z.string())
  }),
  z.object({
    type: z.literal("checkList"),
    items: z.array(z.object({
      text: z.string(),
      checked: z.boolean()
    }))
  }),
  z.object({
    type: z.literal("codeBlock"),
    language: z.string(),
    code: z.string()
  }),
  z.object({
    type: z.literal("quote"),
    text: z.string()
  }),
  z.object({
    type: z.literal("divider")
  }),
  z.object({
    type: z.literal("table"),
    headers: z.array(z.string()),
    rows: z.array(z.array(z.string()))
  }),
  z.object({
    type: z.literal("youtube"),
    url: z.string().url().describe("YouTube video URL")
  }),
  z.object({
    type: z.literal("quiz"),
    topic: z.string(),
    questions: z.array(QuizQuestionSchema)
  })
]);

// Schema for complete note structure
export const NoteStructureSchema = z.object({
  title: z.string().describe("Note title"),
  blocks: z.array(BlockContentSchema).describe("Array of content blocks in order")
});
export const blocksSchema = z.array(BlockContentSchema).describe("Array of content blocks in order")
// ========================================
// 2. CONVERSION FUNCTIONS: SCHEMA → BLOCKNOTE
// ========================================

export function parseInlineFormatting(text: string): any[] {
  const segments: any[] = [];
  let currentText = '';
  let i = 0;

  while (i < text.length) {
    // Math inline ($latex$)
    if (text[i] === '$' && text[i + 1] !== '$') {
      if (currentText) {
        segments.push({ type: 'text', text: currentText, styles: {} });
        currentText = '';
      }
      const endIndex = text.indexOf('$', i + 1);
      if (endIndex !== -1) {
        const latex = text.substring(i + 1, endIndex);
        segments.push({ type: 'math', props: { latex: latex.trim() } });
        i = endIndex + 1;
        continue;
      }
    }

    // Bold (**text**)
    if (text.substr(i, 2) === '**') {
      if (currentText) {
        segments.push({ type: 'text', text: currentText, styles: {} });
        currentText = '';
      }
      const endIndex = text.indexOf('**', i + 2);
      if (endIndex !== -1) {
        const boldText = text.substring(i + 2, endIndex);
        segments.push({ type: 'text', text: boldText, styles: { bold: true } });
        i = endIndex + 2;
        continue;
      }
    }

    // Italic (*text*)
    if (text[i] === '*' && text[i + 1] !== '*') {
      if (currentText) {
        segments.push({ type: 'text', text: currentText, styles: {} });
        currentText = '';
      }
      const endIndex = text.indexOf('*', i + 1);
      if (endIndex !== -1 && text[endIndex + 1] !== '*') {
        const italicText = text.substring(i + 1, endIndex);
        segments.push({ type: 'text', text: italicText, styles: { italic: true } });
        i = endIndex + 1;
        continue;
      }
    }

    // Inline code (`code`)
    if (text[i] === '`' && text[i + 1] !== '`') {
      if (currentText) {
        segments.push({ type: 'text', text: currentText, styles: {} });
        currentText = '';
      }
      const endIndex = text.indexOf('`', i + 1);
      if (endIndex !== -1) {
        const codeText = text.substring(i + 1, endIndex);
        segments.push({ type: 'text', text: codeText, styles: { code: true } });
        i = endIndex + 1;
        continue;
      }
    }

    currentText += text[i];
    i++;
  }

  if (currentText) {
    segments.push({ type: 'text', text: currentText, styles: {} });
  }

  return segments.length > 0 ? segments : [{ type: 'text', text: '', styles: {} }];
}

export function convertSchemaToBlockNote(content: z.infer<typeof blocksSchema>): string {
  const blocks: any[] = [];

  for (const block of content) {
    switch (block.type) {
      case 'heading':
        blocks.push({
          id: randomUUID(),
          type: 'heading',
          props: {
            backgroundColor: 'default',
            textColor: 'default',
            textAlignment: 'left',
            level: parseInt(block.level),
            isToggleable: false
          },
          content: parseInlineFormatting(block.text),
          children: []
        });
        break;

      case 'paragraph':
        blocks.push({
          id: randomUUID(),
          type: 'paragraph',
          props: {
            backgroundColor: 'default',
            textColor: 'default',
            textAlignment: 'left'
          },
          content: parseInlineFormatting(block.text),
          children: []
        });
        break;

      case 'bulletList':
        block.items.forEach(item => {
          blocks.push({
            id: randomUUID(),
            type: 'bulletListItem',
            props: {
              backgroundColor: 'default',
              textColor: 'default',
              textAlignment: 'left'
            },
            content: parseInlineFormatting(item),
            children: []
          });
        });
        break;

      case 'numberedList':
        block.items.forEach(item => {
          blocks.push({
            id: randomUUID(),
            type: 'numberedListItem',
            props: {
              backgroundColor: 'default',
              textColor: 'default',
              textAlignment: 'left'
            },
            content: parseInlineFormatting(item),
            children: []
          });
        });
        break;

      case 'checkList':
        block.items.forEach(item => {
          blocks.push({
            id: randomUUID(),
            type: 'checkListItem',
            props: {
              backgroundColor: 'default',
              textColor: 'default',
              textAlignment: 'left',
              checked: item.checked
            },
            content: parseInlineFormatting(item.text),
            children: []
          });
        });
        break;

      case 'codeBlock':
        blocks.push({
          id: randomUUID(),
          type: 'codeBlock',
          props: {
            language: block.language
          },
          content: [{ type: 'text', text: block.code, styles: {} }],
          children: []
        });
        break;

      case 'quote':
        blocks.push({
          id: randomUUID(),
          type: 'quote',
          props: {
            backgroundColor: 'default',
            textColor: 'default'
          },
          content: parseInlineFormatting(block.text),
          children: []
        });
        break;

      case 'divider':
        blocks.push({
          id: randomUUID(),
          type: 'divider',
          props: {},
          children: []
        });
        break;

      case 'table':
        const tableContent = {
          type: 'tableContent',
          columnWidths: Array(block.headers.length).fill(null),
          rows: [
            {
              cells: block.headers.map(header => ({
                type: 'tableCell',
                content: parseInlineFormatting(header),
                props: {
                  colspan: 1,
                  rowspan: 1,
                  backgroundColor: 'default',
                  textColor: 'default',
                  textAlignment: 'left'
                }
              }))
            },
            ...block.rows.map(row => ({
              cells: row.map(cell => ({
                type: 'tableCell',
                content: parseInlineFormatting(cell),
                props: {
                  colspan: 1,
                  rowspan: 1,
                  backgroundColor: 'default',
                  textColor: 'default',
                  textAlignment: 'left'
                }
              }))
            }))
          ]
        };
        blocks.push({
          id: randomUUID(),
          type: 'table',
          props: { textColor: 'default' },
          content: tableContent,
          children: []
        });
        break;

      case 'youtube':
        let videoUrl = block.url;
        // Convert to embed format
        if (videoUrl.includes('youtube.com/watch?v=')) {
          const videoId = new URL(videoUrl).searchParams.get('v');
          videoUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (videoUrl.includes('youtu.be/')) {
          const videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
          videoUrl = `https://www.youtube.com/embed/${videoId}`;
        }
        blocks.push({
          id: randomUUID(),
          type: 'youtubeVideo',
          props: {
            backgroundColor: 'default',
            textColor: 'default',
            textAlignment: 'left',
            videoUrl: videoUrl
          },
          children: []
        });
        break;

      case 'quiz':
        blocks.push({
          id: randomUUID(),
          type: 'quiz',
          props: {
            topic: block.topic,
            quizzesData: JSON.stringify(block.questions),
            isGeneratingInitial: false
          },
          children: []
        });
        break;
    }
  }

  return JSON.stringify(blocks, null, 2);
}
