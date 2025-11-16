import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy, { Instance as TippyInstance } from "tippy.js";

import { Editor, Range } from "@tiptap/core";
import SlashCommandMenu from "./SlashCommandMenu";

export interface CommandItem {
  title: string;
  description?: string;
  icon: string;
  command: ({ editor, range }: { editor: Editor; range: Range }) => void;
}

const SlashCommand = Extension.create({
  name: "slash-command",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: any }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export default SlashCommand.configure({
  suggestion: {
    items: ({ query }: { query: string }) => {
      const commands: CommandItem[] = [
        {
          title: "Text",
          description: "Just start typing with plain text.",
          icon: "T",
          command: ({ editor, range }: { editor: Editor; range: Range }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .toggleNode("paragraph", "paragraph")
              .run();
          },
        },
        {
          title: "Heading 1",
          description: "Big section heading.",
          icon: "H1",
          command: ({ editor, range }: { editor: Editor; range: Range }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .setNode("heading", { level: 1 })
              .run();
          },
        },
        {
          title: "Heading 2",
          description: "Medium section heading.",
          icon: "H2",
          command: ({ editor, range }: { editor: Editor; range: Range }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .setNode("heading", { level: 2 })
              .run();
          },
        },
        {
          title: "Heading 3",
          description: "Small section heading.",
          icon: "H3",
          command: ({ editor, range }: { editor: Editor; range: Range }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .setNode("heading", { level: 3 })
              .run();
          },
        },
        {
          title: "Bullet List",
          description: "Create a simple bullet list.",
          icon: "•",
          command: ({ editor, range }: { editor: Editor; range: Range }) => {
            editor.chain().focus().deleteRange(range).toggleBulletList().run();
          },
        },
        {
          title: "Numbered List",
          description: "Create a list with numbering.",
          icon: "1.",
          command: ({ editor, range }: { editor: Editor; range: Range }) => {
            editor.chain().focus().deleteRange(range).toggleOrderedList().run();
          },
        },
        {
          title: "To-do List",
          description: "Track tasks with a to-do list.",
          icon: "☐",
          command: ({ editor, range }: { editor: Editor; range: Range }) => {
            editor.chain().focus().deleteRange(range).toggleTaskList().run();
          },
        },
        {
          title: "Whiteboard",
          description: "Add an infinite canvas whiteboard.",
          icon: "🎨",
          command: ({ editor, range }: { editor: Editor; range: Range }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertContent({
                type: "whiteboard",
                attrs: {
                  data: "{}",
                },
              })
              .run();
          },
        },
      ];

      return commands.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase())
      );
    },

    render: () => {
      let component: ReactRenderer;
      let popup: TippyInstance[];

      return {
        onStart: (props: any) => {
          component = new ReactRenderer(SlashCommandMenu, {
            props,
            editor: props.editor,
          });

          if (!props.clientRect) {
            return;
          }

          popup = tippy("body", {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
          });
        },

        onUpdate(props: any) {
          component.updateProps(props);

          if (!props.clientRect) {
            return;
          }

          popup[0].setProps({
            getReferenceClientRect: props.clientRect,
          });
        },

        onKeyDown(props: any) {
          if (props.event.key === "Escape") {
            popup[0].hide();
            return true;
          }

          return component.ref?.onKeyDown(props);
        },

        onExit() {
          popup[0].destroy();
          component.destroy();
        },
      };
    },
  },
});