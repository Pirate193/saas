"use client";

import { BlockNoteEditor, BlockNoteSchema, createCodeBlockSpec, defaultBlockSpecs, filterSuggestionItems, insertOrUpdateBlock, PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import { DefaultReactSuggestionItem, getDefaultReactSlashMenuItems, SuggestionMenuController, SuggestionMenuProps, useCreateBlockNote } from "@blocknote/react";
import { useTheme } from "next-themes";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";
import { codeBlockOptions } from "@blocknote/code-block";
import { Paintbrush, Video, Youtube } from "lucide-react";
import createWhiteboard from "./customBlocks";
import { Fragment } from "react";

import {
  AIMenuSuggestionItem,
  getAIExtension,
  aiDocumentFormats,
  AIMenu,getDefaultAIMenuItems, createAIExtension
} from "@blocknote/xl-ai";
import { ScrollArea } from "../ui/scroll-area";
import { createYoutubeVideo } from "./youtubeBlocks";
import { useConvex, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";


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
    youtubeVideo: createYoutubeVideo(),
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
// Define the slash menu item for the YouTube block
const insertYoutubeVideoItem = (
  editor: BlockNoteEditor<typeof customSchema.blockSchema>
): DefaultReactSuggestionItem => ({
  title: "YouTube Video",
  onItemClick: () => {
    insertOrUpdateBlock(editor, {
      type: "youtubeVideo",
    });
  },
  aliases: ["youtube", "video", "embed", "yt"],
  group: "other",
  icon: <Video size={18} />,
  subtext: "Embed a YouTube video",
});
const getCustomSlashMenuItems = (
  editor: BlockNoteEditor<typeof customSchema.blockSchema>
): DefaultReactSuggestionItem[] => [
  ...getDefaultReactSlashMenuItems(editor),
  insertWhiteboardItem(editor),
  insertYoutubeVideoItem(editor),
  // insertGraphItem(editor),
];
const BlocknoteEditor = ({
  initialContent,
  onChangeContent,
  editable = true,
}: BlocknoteEditorProps) => {
  const { resolvedTheme } = useTheme();

  const convex = useConvex();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getUrl = useMutation(api.files.getUrl);

  /**
   * This function handles file uploads for BlockNote.
   * It's used by the default 'Image' and 'File' (video/etc) blocks.
   */
  const handleUpload = async (file: File): Promise<string> => {
    // 7. REMOVED THE IMAGE CHECK
    // This logic is generic and works for ANY file type.
    try {
      // 1. Get the Convex upload URL
      const postUrl = await generateUploadUrl();

      // 2. Upload the file to Convex
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();

      // 3. Get the URL for the uploaded file
      // We can use the client-side `storage.getUrl`
      const url = await getUrl({storageId});
      if (!url) {
        throw new Error("Could not get file URL.");
      }
      return url;

    } catch (error) {
      console.error("Failed to upload file:", error);
      throw new Error("Upload failed. Please try again.");
    }
  };
  // Parse initial content safely
 const parseInitialContent = (): PartialBlock[] | undefined => {
  if (!initialContent || initialContent.trim() === "" || initialContent === '""') {
    return undefined;
  }
  
  try {
    const parsed = JSON.parse(initialContent);
    
    // Validate that we got an array
    if (!Array.isArray(parsed)) {
      console.warn("Initial content is not an array, starting with empty editor");
      return undefined;
    }
    
    // Validate and clean each block
    const validBlocks = parsed.filter((block: any) => {
      if (!block || typeof block !== 'object') {
        console.warn("Invalid block found:", block);
        return false;
      }
      
      // Ensure required properties exist
      if (!block.type || !block.id) {
        console.warn("Block missing required properties:", block);
        return false;
      }
      
      return true;
    });
    
    return validBlocks.length > 0 ? validBlocks : undefined;
  } catch (error) {
    console.error("Failed to parse initial content:", error);
    return undefined;
  }
};

  // Create editor with proper typing
  const editor = useCreateBlockNote({
    initialContent: parseInitialContent(),
    schema:customSchema,
    uploadFile:handleUpload,
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
        suggestionMenuComponent={CustomSlashMenu}
      />
    </BlockNoteView>
  );
};

export default BlocknoteEditor;

function CustomSlashMenu(
  props: SuggestionMenuProps<DefaultReactSuggestionItem>,
) {
  let currentGroup: string | null = null;
  return (
   <div className="bg-popover text-popover-foreground rounded-lg shadow-md w-72 overflow-hidden border overflow-y-auto scrollbar-hidden">
      {/* Scrollable area for long lists */}
      <ScrollArea className="max-h-72 "> {/* You can adjust max-h */}
        {/* We add p-1 here so the scrollbar doesn't overlap the content */}
        <div className="p-1">
          {props.items.length > 0 ? (
            props.items.map((item, index) => {
              const showHeader = item.group !== currentGroup;
              currentGroup = item.group!;

              return (
                <Fragment key={index}>
                  {/* Group header */}
                  {showHeader && (
                    <div className="text-xs font-semibold text-muted-foreground uppercase pt-2 pb-1 px-2">
                      {item.group}
                    </div>
                  )}

                  {/* Menu Item, using accent for selection */}
                  <div
                    className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm ${
                      props.selectedIndex === index
                        ? "bg-accent text-accent-foreground" // Selected style
                        : "hover:bg-accent hover:text-accent-foreground" // Hover style
                    }`}
                    onClick={() => {
                      props.onItemClick?.(item);
                    }}
                  >
                    {/* Icon */}
                    <div className="text-muted-foreground">{item.icon}</div>
                    {/* Title */}
                    <span className="font-medium">{item.title}</span>
                  </div>
                </Fragment>
              );
            })
          ) : (
            // No results state
            <div className="p-2 text-sm text-muted-foreground">No results</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}