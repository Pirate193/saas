import { createReactBlockSpec } from "@blocknote/react";
import { defaultProps } from "@blocknote/core";
import { useTheme } from "next-themes";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

// 1. Define the "blueprint" for the block
const createMinimalWhiteboard = createReactBlockSpec(
  {
    type: "whiteboard",
    propSchema: {
      ...defaultProps,
      // We removed `whiteboardState`. This block stores NO custom data.
    },
    content: "none", // It's a "leaf" block, you can't type in it.
  },
  {
    // 2. Tell BlockNote to render our React component
    render: (props) => <MinimalWhiteboardBlock {...props} />,
  }
);

export default createMinimalWhiteboard;

// 3. This is the simple React component that gets rendered
function MinimalWhiteboardBlock({ block, editor }: any) {
  const { resolvedTheme } = useTheme();

  return (
    // We still need a container with a fixed size for tldraw to work
    <div
      style={{
        width: "100%",
        height: "500px", // You can change this height
        border: "2px solid var(--border, #e5e7eb)",
        borderRadius: "12px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Tldraw
        // Just tell tldraw to match the theme
        inferDarkMode={resolvedTheme === "dark"}
        // Don't auto-focus when it's created
        autoFocus={false}
      />
    </div>
  );
}