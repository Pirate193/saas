"use client";

import { BlockNoteEditor, BlockNoteSchema, createCodeBlockSpec, defaultBlockSpecs, filterSuggestionItems, insertOrUpdateBlock, PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import { DefaultReactSuggestionItem, getDefaultReactSlashMenuItems, SuggestionMenuController, useCreateBlockNote } from "@blocknote/react";
import { useTheme } from "next-themes";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";
import { codeBlockOptions } from "@blocknote/code-block";
import { Paintbrush } from "lucide-react";
import createWhiteboard from "./customBlocks";

interface BlocknoteEditorProps {
  initialContent?: string;
  onChangeContent: (value: string) => void;
  editable?: boolean;
}
const customSchema = BlockNoteSchema.create({
  blockSpecs: {
    // Include all default blocks
    ...defaultBlockSpecs,
    // Add code block with syntax highlighting
    codeBlock: createCodeBlockSpec(codeBlockOptions),
    // Add our custom blocks
    whiteboard: createWhiteboard(),
    // graph: createGraph(),
  },
});
const insertWhiteboardItem = (
  editor: BlockNoteEditor<typeof customSchema.blockSchema>
): DefaultReactSuggestionItem => ({
  title: "Whiteboard",
  onItemClick: () => {
    // Insert a new whiteboard block at the current position
    insertOrUpdateBlock(editor, {
      type: "whiteboard",
    });
  },
  aliases: ["draw", "sketch", "canvas", "whiteboard", "tldraw"],
  group: "other",
  icon: <Paintbrush size={18} />,
  subtext: "Add an interactive whiteboard for drawings and diagrams",
});
const getCustomSlashMenuItems = (
  editor: BlockNoteEditor<typeof customSchema.blockSchema>
): DefaultReactSuggestionItem[] => [
  ...getDefaultReactSlashMenuItems(editor),
  insertWhiteboardItem(editor),
  // insertGraphItem(editor),
];
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
  const editor = useCreateBlockNote({
    initialContent: parseInitialContent(),
    schema:customSchema
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
      slashMenu={false}
    >
      <SuggestionMenuController
        triggerCharacter="/"
        getItems={async (query) =>
          // Filter items based on user's search query
          filterSuggestionItems(getCustomSlashMenuItems(editor), query)
        }
      />
    </BlockNoteView>
  );
};

export default BlocknoteEditor;