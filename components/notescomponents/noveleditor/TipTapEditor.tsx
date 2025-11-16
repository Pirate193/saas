"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { BubbleMenu } from '@tiptap/react/menus';
import { useEffect } from "react";
import EditorBubbleMenu from "./EditorBubbleMenu";
import SlashCommand from "./slash-command";

interface TiptapEditorProps {
  initialContent: string;
  onChangeContent: (content: string) => void;
}

const TiptapEditor = ({ initialContent, onChangeContent }: TiptapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-500 underline cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return "Heading";
          }
          return "Press '/' for commands...";
        },
      }),
      SlashCommand,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none max-w-none p-8",
      },
    },
    onUpdate: ({ editor }) => {
      // Convert to JSON instead of HTML
      const json = editor.getJSON();
      onChangeContent(JSON.stringify(json));
    },
    immediatelyRender: false,
  });

useEffect(() => {
    if (editor && initialContent) {
      try {
        const parsedContent = JSON.parse(initialContent);
        if (JSON.stringify(editor.getJSON()) !== initialContent) {
          editor.commands.setContent(parsedContent);
        }
      } catch (error) {
        console.error("Error parsing initial content:", error);
      }
    }
  }, [initialContent, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative w-full">
      <EditorContent editor={editor} />
      <BubbleMenu editor={editor} >
        <EditorBubbleMenu editor={editor} />
      </BubbleMenu>
    </div>
  );
};

export default TiptapEditor;