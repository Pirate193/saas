"use client";

import { BlockNoteEditor, BlockNoteSchema, createCodeBlockSpec, PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import { useCreateBlockNote } from "@blocknote/react";
import { useTheme } from "next-themes";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";
import { codeBlockOptions } from "@blocknote/code-block";

interface BlocknoteEditorProps {
  initialContent?: string;
  onChangeContent: (value: string) => void;
  editable?: boolean;
}

const BlocknoteEditor = ({
  initialContent,
  onChangeContent,
  editable = true,
}: BlocknoteEditorProps) => {
  const { resolvedTheme } = useTheme();

  // Parse initial content safely
  const parseInitialContent = (): PartialBlock[] | undefined => {
    if (!initialContent) return undefined;
    
    try {
      return JSON.parse(initialContent) as PartialBlock[];
    } catch (error) {
      console.error("Failed to parse initial content:", error);
      return undefined;
    }
  };

  // Create editor with proper typing
  const editor: BlockNoteEditor = useCreateBlockNote({
    initialContent: parseInitialContent(),
    schema:BlockNoteSchema.create().extend({
      blockSpecs:{
        codeBlock:createCodeBlockSpec(codeBlockOptions)
      }
    })
  });

  // Handle content changes
  const handleChange = () => {
    try {
      const blocks = editor.document;
      const content = JSON.stringify(blocks, null, 2);
      onChangeContent(content);
    } catch (error) {
      console.error("Failed to serialize content:", error);
    }
  };

  return (
    <BlockNoteView
      editor={editor}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      editable={editable}
      onChange={handleChange}
    
    />
  );
};

export default BlocknoteEditor;