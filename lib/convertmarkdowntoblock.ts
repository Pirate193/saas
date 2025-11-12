// lib/markdown-to-blocknote.ts
import { randomUUID } from 'crypto';

interface BlockNoteBlock {
  id: string;
  type: string;
  props: Record<string, any>;
  content: Array<{ type: string; text: string; styles: Record<string, any> }>;
  children: BlockNoteBlock[];
}

interface TextContent {
  type: string;
  text: string;
  styles: Record<string, any>;
}

/**
 * Converts markdown text to BlockNote JSON format
 * This handles the conversion from LLM-generated markdown to BlockNote's structure
 */
export function markdownToBlockNote(markdown: string): string {
  if (!markdown || markdown.trim() === '') {
    // Return a single empty paragraph for empty input
    return JSON.stringify([createBlock('paragraph', {}, [])], null, 2);
  }

  const lines = markdown.split('\n');
  const blocks: BlockNoteBlock[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const block = parseLine(line, lines, i);
    
    if (block) {
      blocks.push(block);
      // If it's a code block, skip the lines we've consumed
      if (block.type === 'codeBlock' && (block.props as any).consumedLines) {
        i += (block.props as any).consumedLines;
        delete (block.props as any).consumedLines;
      }
    }
    
    i++;
  }
  
  // Ensure we always have at least one block
  if (blocks.length === 0) {
    blocks.push(createBlock('paragraph', {}, []));
  }
  
  return JSON.stringify(blocks, null, 2);
}

function parseLine(line: string, allLines: string[], currentIndex: number): BlockNoteBlock | null {
  const trimmed = line.trim();
  
  // Empty line -> empty paragraph
  if (!trimmed) {
    return createBlock('paragraph', {}, []);
  }
  
  // Headings (# ## ###)
  const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
  if (headingMatch) {
    const level = Math.min(headingMatch[1].length, 3) as 1 | 2 | 3;
    const text = headingMatch[2].trim();
    return createBlock('heading', { level }, parseInlineContent(text));
  }
  
  // Code blocks (```language)
  if (trimmed.startsWith('```')) {
    const language = trimmed.slice(3).trim() || 'plaintext';
    const codeLines: string[] = [];
    let j = currentIndex + 1;
    
    // Collect code lines until closing ```
    while (j < allLines.length && !allLines[j].trim().startsWith('```')) {
      codeLines.push(allLines[j]);
      j++;
    }
    
    const codeText = codeLines.join('\n');
    const block = createBlock('codeBlock', { language }, [createTextContent(codeText)]);
    (block.props as any).consumedLines = j - currentIndex;
    return block;
  }
  
  // Bullet list (- or *)
  const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
  if (bulletMatch && !trimmed.match(/^[-*]\s+\[/)) { // Not a checkbox
    const text = bulletMatch[1].trim();
    return createBlock('bulletListItem', {}, parseInlineContent(text));
  }
  
  // Numbered list (1. 2. etc)
  const numberedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
  if (numberedMatch) {
    const text = numberedMatch[1].trim();
    return createBlock('numberedListItem', {}, parseInlineContent(text));
  }
  
  // Checkbox list (- [ ] or - [x])
  const checkboxMatch = trimmed.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
  if (checkboxMatch) {
    const checked = checkboxMatch[1].toLowerCase() === 'x';
    const text = checkboxMatch[2].trim();
    return createBlock('checkListItem', { checked }, parseInlineContent(text));
  }
  
  // Blockquote (> text)
  if (trimmed.startsWith('>')) {
    const text = trimmed.slice(1).trim();
    return createBlock('paragraph', {}, parseInlineContent(text));
  }
  
  // Default: paragraph with inline formatting
  return createBlock('paragraph', {}, parseInlineContent(trimmed));
}

/**
 * Parse inline markdown formatting (bold, italic, code, links)
 * This creates an array of text content with proper styles
 */
function parseInlineContent(text: string): TextContent[] {
  const segments: TextContent[] = [];
  let currentText = '';
  let i = 0;
  
  // Simple parsing - can be enhanced for nested formatting
  while (i < text.length) {
    // Bold (**text**)
    if (text.substr(i, 2) === '**') {
      if (currentText) {
        segments.push(createTextContent(currentText));
        currentText = '';
      }
      
      const endIndex = text.indexOf('**', i + 2);
      if (endIndex !== -1) {
        const boldText = text.substring(i + 2, endIndex);
        segments.push(createTextContent(boldText, { bold: true }));
        i = endIndex + 2;
        continue;
      }
    }
    
    // Italic (*text* but not **)
    if (text[i] === '*' && text[i + 1] !== '*') {
      if (currentText) {
        segments.push(createTextContent(currentText));
        currentText = '';
      }
      
      const endIndex = text.indexOf('*', i + 1);
      if (endIndex !== -1 && text[endIndex + 1] !== '*') {
        const italicText = text.substring(i + 1, endIndex);
        segments.push(createTextContent(italicText, { italic: true }));
        i = endIndex + 1;
        continue;
      }
    }
    
    // Inline code (`code`)
    if (text[i] === '`') {
      if (currentText) {
        segments.push(createTextContent(currentText));
        currentText = '';
      }
      
      const endIndex = text.indexOf('`', i + 1);
      if (endIndex !== -1) {
        const codeText = text.substring(i + 1, endIndex);
        segments.push(createTextContent(codeText, { code: true }));
        i = endIndex + 1;
        continue;
      }
    }
    
    currentText += text[i];
    i++;
  }
  
  // Add remaining text
  if (currentText) {
    segments.push(createTextContent(currentText));
  }
  
  return segments.length > 0 ? segments : [createTextContent('')];
}

function createBlock(
  type: string,
  customProps: Record<string, any>,
  content: TextContent[]
): BlockNoteBlock {
  const defaultProps: Record<string, any> = {
    backgroundColor: 'default',
    textColor: 'default',
    textAlignment: 'left',
  };
  
  const props = { ...defaultProps, ...customProps };
  
  return {
    id: randomUUID(),
    type,
    props,
    content,
    children: [],
  };
}

function createTextContent(
  text: string,
  styles: Record<string, any> = {}
): TextContent {
  return {
    type: 'text',
    text,
    styles,
  };
}

/**
 * Helper to validate BlockNote JSON structure
 */
export function isValidBlockNoteJSON(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return false;
    
    return parsed.every((block: any) => 
      block.id &&
      block.type &&
      block.props &&
      Array.isArray(block.content) &&
      Array.isArray(block.children)
    );
  } catch {
    return false;
  }
}

/**
 * Example usage:
 * 
 * const markdown = `# Introduction to React
 * 
 * React is a **JavaScript library** for building *user interfaces*.
 * 
 * ## Key Features
 * 
 * - Component-based architecture
 * - Virtual DOM
 * - Declarative syntax
 * 
 * ### Code Example
 * 
 * \`\`\`javascript
 * function Welcome() {
 *   return <h1>Hello, World!</h1>;
 * }
 * \`\`\`
 * 
 * You can use inline \`code\` like this.
 * 
 * - [ ] Learn React basics
 * - [x] Read documentation
 * `;
 * 
 * const blockNoteJSON = markdownToBlockNote(markdown);
 */