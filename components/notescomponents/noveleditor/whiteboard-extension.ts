import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import WhiteboardComponent from "./whiteboardComponent";


export default Node.create({
  name: "whiteboard",

  group: "block",

  atom: true,

  addAttributes() {
    return {
      data: {
        default: "{}",
        parseHTML: (element) => element.getAttribute("data-whiteboard"),
        renderHTML: (attributes) => {
          return {
            "data-whiteboard": attributes.data,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="whiteboard"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "whiteboard" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(WhiteboardComponent);
  },
});