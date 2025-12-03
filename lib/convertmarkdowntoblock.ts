import { randomUUID } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

interface BlockNoteBlock {
  id: string;
  type: string;
  props: Record<string, any>;
  content?: any; // Can be array or object (for tables)
  children: BlockNoteBlock[];
}

interface TextContent {
  type: string;
  text?: string;
  props?: Record<string, any>;
  styles?: Record<string, any>;
}

/**
 * Enhanced markdown to BlockNote converter
 * Supports custom blocks: YouTube, Quiz, Tables, Math, Dividers
 */
export function markdownToBlockNote(markdown: string): string {
  if (!markdown || markdown.trim() === '') {
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
      // Skip consumed lines
      if ((block.props as any).consumedLines) {
        i += (block.props as any).consumedLines;
        delete (block.props as any).consumedLines;
      }
    }

    i++;
  }

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

  // ============ CUSTOM BLOCKS ============

  // Divider/Separator (--- or ***)
  if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
    return {
      id: uuidv4(),
      type: 'divider',
      props: {},
      children: []
    };
  }

  // YouTube Video (@youtube[URL])
  const youtubeMatch = trimmed.match(/^@youtube\s*\[\s*(.+?)\s*\]\s*$/i);
  if (youtubeMatch) {
    let videoUrl = youtubeMatch[1].trim();
    
    // Convert to Embed URL if needed
    try {
      if (videoUrl.includes('youtube.com/watch')) {
        const urlObj = new URL(videoUrl);
        const v = urlObj.searchParams.get('v');
        if (v) videoUrl = `https://www.youtube.com/embed/${v}`;
      } else if (videoUrl.includes('youtu.be/')) {
        const v = videoUrl.split('youtu.be/')[1]?.split('?')[0];
        if (v) videoUrl = `https://www.youtube.com/embed/${v}`;
      }
    } catch (e) {
      // If URL parsing fails, keep original
      console.warn("Failed to parse YouTube URL:", videoUrl);
    }
    
  
      const block= {
        id: uuidv4(),
        type: 'youtubeVideo',
        props: {
          backgroundColor: 'default',
          textColor: 'default',
          textAlignment: 'left',
          videoUrl: videoUrl
        },
        children: []
      }
    return block;
  }

  // Quiz Block (@quiz[topic]{JSON})
 const quizMatch = trimmed.match(/^@quiz\[(.+?)\]\{/);
if (quizMatch) {
  const topic = quizMatch[1].trim();
  let fullContent = '';
  let j = currentIndex;

  // Collect all lines until we find the matching closing brace
  while (j < allLines.length) {
    fullContent += allLines[j];
    if (j > currentIndex) fullContent += '\n';
    j++;
    
    // Check if we've collected the complete quiz block
    // Count braces to find the matching closing brace
    let braceCount = 0;
    let inQuiz = false;
    
    for (const char of fullContent) {
      if (char === '{') {
        braceCount++;
        inQuiz = true;
      } else if (char === '}') {
        braceCount--;
        if (inQuiz && braceCount === 0) {
          // Found matching closing brace
          break;
        }
      }
    }
    
    if (inQuiz && braceCount === 0) break;
  }

  try {
    // Extract JSON between the outer { }
    // Format: @quiz[topic]{ JSON_ARRAY }
    const startBrace = fullContent.indexOf('{');
    const endBrace = fullContent.lastIndexOf('}');
    
    if (startBrace === -1 || endBrace === -1 || endBrace <= startBrace) {
      console.error('Invalid quiz format: missing braces');
      return createBlock('paragraph', {}, [createTextContent(`[Invalid Quiz: ${topic}]`)]);
    }
    
    // Extract content between braces (skip the outer { })
    const jsonContent = fullContent.substring(startBrace + 1, endBrace).trim();
    
    // Validate it's proper JSON array
    const parsed = safeJsonParse(jsonContent);
    
    if (!Array.isArray(parsed)) {
      throw new Error('Quiz data must be a JSON array');
    }
    
    const block = {
      id: uuidv4(),
      type: 'quiz',
      props: {
        topic: topic,
        quizzesData: jsonContent, // Store the array JSON string
        isGeneratingInitial: false
      },
      children: []
    };
    
    (block.props as any).consumedLines = j - currentIndex - 1;
    return block;
    
  } catch (e) {
    console.error('Invalid quiz JSON:', e);
    return createBlock('paragraph', {}, [createTextContent(`[Invalid Quiz: ${topic}]`)]);
  }
}
  // Table (@table or markdown table)
  if (trimmed.startsWith('@table') || trimmed.startsWith('|')) {
    return parseTable(allLines, currentIndex);
  }

  // ============ STANDARD BLOCKS ============

  // Headings (# ## ###)
  const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
  if (headingMatch) {
    const level = Math.min(headingMatch[1].length, 3) as 1 | 2 | 3;
    const text = headingMatch[2].trim();
    return createBlock('heading', { level, isToggleable: false }, parseInlineContent(text));
  }

  // Code blocks (```language)
  if (trimmed.startsWith('```')) {
    const language = trimmed.slice(3).trim() || 'plaintext';
    const codeLines: string[] = [];
    let j = currentIndex + 1;

    while (j < allLines.length && !allLines[j].trim().startsWith('```')) {
      codeLines.push(allLines[j]);
      j++;
    }

    const codeText = codeLines.join('\n');
    const block = {
      id: uuidv4(),
      type: 'codeBlock',
      props: { language },
      content: [createTextContent(codeText)],
      children: []
    };
    (block.props as any).consumedLines = j - currentIndex;
    return block;
  }

  // Blockquote (> text)
  if (trimmed.startsWith('>')) {
    const text = trimmed.slice(1).trim();
    return {
      id: uuidv4(),
      type: 'quote',
      props: {
        backgroundColor: 'default',
        textColor: 'default'
      },
      content: parseInlineContent(text),
      children: []
    };
  }

  // Bullet list (- or *)
  const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
  if (bulletMatch && !trimmed.match(/^[-*]\s+\[/)) {
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

  // Default: paragraph with inline formatting
  return createBlock('paragraph', {}, parseInlineContent(trimmed));
}

/**
 * Parse markdown tables into BlockNote table structure
 */
function parseTable(lines: string[], startIndex: number): BlockNoteBlock | null {
  const tableLines: string[] = [];
  let i = startIndex;

  // Collect table lines
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line.startsWith('|') && i > startIndex) break;
    if (line.startsWith('|')) {
      tableLines.push(line);
    }
    i++;
  }

  if (tableLines.length < 2) return null;

  // Parse table rows
  const rows = tableLines
    .filter((line, idx) => {
      // Skip separator line (|---|---|)
      if (idx === 1 && line.match(/^\|[\s\-:|]+\|$/)) return false;
      return true;
    })
    .map(line => {
      return line
        .split('|')
        .slice(1, -1) // Remove empty first/last elements
        .map(cell => cell.trim());
    });

  if (rows.length === 0) return null;

  // Build table structure
  const columnCount = rows[0].length;
  const tableContent = {
    type: 'tableContent',
    columnWidths: Array(columnCount).fill(null),
    rows: rows.map(row => ({
      cells: row.map(cellText => ({
        type: 'tableCell',
        content: parseInlineContent(cellText),
        props: {
          colspan: 1,
          rowspan: 1,
          backgroundColor: 'default',
          textColor: 'default',
          textAlignment: 'left'
        }
      }))
    }))
  };

  const block = {
    id: uuidv4(),
    type: 'table',
    props: {
      textColor: 'default'
    },
    content: tableContent,
    children: []
  };

  (block.props as any).consumedLines = i - startIndex - 1;
  return block;
}

/**
 * Parse inline markdown formatting including math
 * Supports: bold, italic, code, strikethrough, math ($latex$)
 */
function parseInlineContent(text: string): TextContent[] {
  const segments: TextContent[] = [];
  let currentText = '';
  let i = 0;

  while (i < text.length) {
    // Math inline ($latex$)
    if (text[i] === '$' && text[i + 1] !== '$') {
      if (currentText) {
        segments.push(createTextContent(currentText));
        currentText = '';
      }

      const endIndex = text.indexOf('$', i + 1);
      if (endIndex !== -1) {
        const latex = text.substring(i + 1, endIndex);
        segments.push({
          type: 'math',
          props: {
            latex: latex.trim()
          }
        });
        i = endIndex + 1;
        continue;
      }
    }

    // Bold (**text** or __text__)
    if (text.substr(i, 2) === '**' || text.substr(i, 2) === '__') {
      if (currentText) {
        segments.push(createTextContent(currentText));
        currentText = '';
      }

      const delimiter = text.substr(i, 2);
      const endIndex = text.indexOf(delimiter, i + 2);
      if (endIndex !== -1) {
        const boldText = text.substring(i + 2, endIndex);
        segments.push(createTextContent(boldText, { bold: true }));
        i = endIndex + 2;
        continue;
      }
    }

    // Italic (*text* or _text_)
    if ((text[i] === '*' && text[i + 1] !== '*') || (text[i] === '_' && text[i + 1] !== '_')) {
      if (currentText) {
        segments.push(createTextContent(currentText));
        currentText = '';
      }

      const delimiter = text[i];
      const endIndex = text.indexOf(delimiter, i + 1);
      if (endIndex !== -1 && text[endIndex + 1] !== delimiter) {
        const italicText = text.substring(i + 1, endIndex);
        segments.push(createTextContent(italicText, { italic: true }));
        i = endIndex + 1;
        continue;
      }
    }

    // Strikethrough (~~text~~)
    if (text.substr(i, 2) === '~~') {
      if (currentText) {
        segments.push(createTextContent(currentText));
        currentText = '';
      }

      const endIndex = text.indexOf('~~', i + 2);
      if (endIndex !== -1) {
        const strikeText = text.substring(i + 2, endIndex);
        segments.push(createTextContent(strikeText, { strike: true }));
        i = endIndex + 2;
        continue;
      }
    }

    // Inline code (`code`)
    if (text[i] === '`' && text[i + 1] !== '`') {
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
    id: uuidv4(),
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
function safeJsonParse(jsonString: string): any[] {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    // 1. Try identifying bad escapes.
    // Regex explanation: Match a backslash '\' that is NOT followed by:
    // - another backslash or quote (["\\])
    // - a valid control character ([bfnrt])
    // - a unicode sequence (u)
    // We replace it with double backslash '\\'
    const fixedString = jsonString.replace(/\\(?![\\"/bfnrtu])/g, "\\\\");
    
    try {
      return JSON.parse(fixedString);
    } catch (e2) {
      console.error("JSON Repair Failed:", e2);
      throw e; // Original error was likely the real issue if repair fails
    }
  }
}

/**
 * Convert BlockNote back to markdown with custom blocks
 */
export function blockNoteToMarkdown(blockNoteJSON: string): string {
  try {
    const blocks: BlockNoteBlock[] = JSON.parse(blockNoteJSON);
    if (!Array.isArray(blocks)) {
      throw new Error('Invalid BlockNote format');
    }

    const lines: string[] = [];

    for (const block of blocks) {
      const line = blockToMarkdown(block);
      if (line !== null) {
        lines.push(line);
      }
    }

    return lines.join('\n');
  } catch (error) {
    console.error('Error converting BlockNote to Markdown:', error);
    return '';
  }
}

function blockToMarkdown(block: BlockNoteBlock): string | null {
  switch (block.type) {
    case 'heading': {
      const level = block.props.level || 1;
      const hashes = '#'.repeat(level);
      const content = contentToMarkdown(block.content);
      return `${hashes} ${content}`;
    }

    case 'paragraph': {
      return contentToMarkdown(block.content) || '';
    }

    case 'quote': {
      const content = contentToMarkdown(block.content);
      return `> ${content}`;
    }

    case 'bulletListItem': {
      return `- ${contentToMarkdown(block.content)}`;
    }

    case 'numberedListItem': {
      return `1. ${contentToMarkdown(block.content)}`;
    }

    case 'checkListItem': {
      const checked = block.props.checked ? 'x' : ' ';
      return `- [${checked}] ${contentToMarkdown(block.content)}`;
    }

    case 'codeBlock': {
      const language = block.props.language || '';
      const code = Array.isArray(block.content) ? block.content.map(c => c.text).join('') : '';
      return `\`\`\`${language}\n${code}\n\`\`\``;
    }

    case 'divider': {
      return '---';
    }

    case 'youtubeVideo': {
      return `@youtube[${block.props.videoUrl}]`;
    }

    case 'quiz': {
      return `@quiz[${block.props.topic}]${block.props.quizzesData}`;
    }

    case 'table': {
      if (!block.content || !block.content.rows) return null;
      
      const rows = block.content.rows;
      const tableLines: string[] = [];

      rows.forEach((row: any, idx: number) => {
        const cells = row.cells.map((cell: any) => {
          return contentToMarkdown(cell.content);
        });
        tableLines.push(`| ${cells.join(' | ')} |`);

        // Add separator after first row
        if (idx === 0) {
          const separator = cells.map(() => '---').join(' | ');
          tableLines.push(`| ${separator} |`);
        }
      });

      return tableLines.join('\n');
    }

    default: {
      return contentToMarkdown(block.content || []) || '';
    }
  }
}

function contentToMarkdown(content: any[]): string {
  if (!content || content.length === 0) return '';

  return content.map(segment => {
    // Handle math inline
    if (segment.type === 'math') {
      return `$${segment.props.latex}$`;
    }

    // Handle text with styles
    if (segment.type === 'text') {
      let text = segment.text || '';
      const styles = segment.styles || {};

      if (styles.code) return `\`${text}\``;
      if (styles.strike) text = `~~${text}~~`;
      if (styles.bold && styles.italic) return `***${text}***`;
      if (styles.bold) return `**${text}**`;
      if (styles.italic) return `*${text}*`;

      return text;
    }

    return '';
  }).join('');
}

// Utility functions remain the same
export function isValidBlockNoteJSON(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return false;
    return parsed.every((block: any) =>
      block.id &&
      block.type &&
      block.props &&
      Array.isArray(block.children)
    );
  } catch {
    return false;
  }
}

export function blockNoteToPlainText(blockNoteJSON: string): string {
  try {
    const blocks: BlockNoteBlock[] = JSON.parse(blockNoteJSON);
    const texts = blocks.map(block => {
      if (Array.isArray(block.content)) {
        return block.content
          .filter(c => c.type === 'text')
          .map(c => c.text)
          .join('')
          .trim();
      }
      return '';
    }).filter(Boolean);
    return texts.join(' ');
  } catch {
    return '';
  }
}

export function getBlockNoteWordCount(blockNoteJSON: string): number {
  const plainText = blockNoteToPlainText(blockNoteJSON);
  if (!plainText) return 0;
  return plainText.split(/\s+/).filter(Boolean).length;
}

export function extractHeadings(blockNoteJSON: string): Array<{ level: number; text: string }> {
  try {
    const blocks: BlockNoteBlock[] = JSON.parse(blockNoteJSON);
    return blocks
      .filter(block => block.type === 'heading')
      .map(block => ({
        level: block.props.level || 1,
        text: Array.isArray(block.content) ? block.content.map(c => c.text).join('') : '',
      }));
  } catch {
    return [];
  }
}