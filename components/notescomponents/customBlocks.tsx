import { createReactBlockSpec } from "@blocknote/react";
import { defaultProps } from "@blocknote/core";
import { useTheme } from "next-themes";
import { Tldraw, Editor } from "tldraw"; // Import Editor type
import "tldraw/tldraw.css";
import { useCallback, useEffect, useRef } from "react"; // Import useRef

// 1. Define the "blueprint"
const createWhiteboard = createReactBlockSpec(
  {
    type: "whiteboard",
    propSchema: {
      ...defaultProps,
      // STEP 1: Add our data prop back
      // This is where the tldraw state will be saved
      whiteboardState: { default: "" as const },
    },
    content: "none",
  },
  {
    render: (props) => <WhiteboardBlock {...props} />,
  }
);

export default createWhiteboard;

// 2. This is the React component that renders the block
function WhiteboardBlock({ block, editor }: any) {
  const { resolvedTheme } = useTheme();

  // Ref to store the tldraw editor instance
  const tldrawEditorRef = useRef<Editor | null>(null);

  // Ref to track if the component is still mounted
  const isMountedRef = useRef(true);

  // Ref to store the last saved state (to avoid saving if nothing changed)
  const lastSavedStateRef = useRef<string>(block.props.whiteboardState);

  // Ref to store the debounce timer
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Auto-Save Functions ---

  // STEP 1: The raw "save" function
  // This is wrapped in useCallback to keep it stable
  const saveState = useCallback(() => {
    // Check 1: Don't save if component is unmounted
    if (!isMountedRef.current) {
      return;
    }
    // Check 2: Don't save if editor isn't ready
    if (!tldrawEditorRef.current) {
      return;
    }

    try {
      const snapshot = tldrawEditorRef.current.store.getStoreSnapshot();
      const stateString = JSON.stringify(snapshot);

      // Check 3: Only save if the state has actually changed
      if (stateString !== lastSavedStateRef.current) {
        lastSavedStateRef.current = stateString;
        editor.updateBlock(block.id, {
          props: { whiteboardState: stateString },
        });
      }
    } catch (error) {
      // This error can happen if block is deleted
      // We can safely ignore it.
      console.warn("BlockNote: Failed to save whiteboard state:", error);
    }
  }, [block.id, editor]); // Depends on block.id and editor

  // STEP 2: The "debounced" save function
  // This function will be called on every change
  const debouncedSave = useCallback(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    // Set a new timer
    debounceTimerRef.current = setTimeout(() => {
      saveState();
    }, 2000); // Wait 2 seconds before saving
  }, [saveState]); // Depends on the stable saveState function

  // STEP 3: The "onMount" callback
  const handleMount = useCallback(
    (tldrawEditor: Editor) => {
      // Save the editor instance
      tldrawEditorRef.current = tldrawEditor;

      // Load saved data (if any)
      if (block.props.whiteboardState) {
        try {
          const savedState = JSON.parse(block.props.whiteboardState);
          // Use a small timeout to ensure editor is fully ready
          setTimeout(() => {
            if (isMountedRef.current && tldrawEditorRef.current) {
              tldrawEditor.store.loadStoreSnapshot(savedState);
              // Set the last saved state
              lastSavedStateRef.current = block.props.whiteboardState;
            }
          }, 100);
        } catch (error) {
          console.error("Failed to load whiteboard state:", error);
        }
      }

      // STEP 4: Set up the listener
      // tldraw's store lets us listen for changes
      const cleanupListener = tldrawEditor.store.listen(
        (entry) => {
          // We only care about user-made changes to the drawing
          if (entry.source === "user") {
            // On any change, trigger the debounced save
            debouncedSave();
          }
        }
      );

      // tldraw also provides its own cleanup function
      return () => {
        cleanupListener();
      };
    },
    [block.props.whiteboardState, debouncedSave]
  );

  // STEP 5: React's unmount cleanup
  useEffect(() => {
    // Set mounted ref to true when component mounts
    isMountedRef.current = true;

    // This is the function that runs when React unmounts
    return () => {
      // 1. Mark as unmounted
      isMountedRef.current = false;

      // 2. Clear any pending save timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      // 3. Clear the editor ref
      tldrawEditorRef.current = null;

      // Notice: We DO NOT try to save here.
      // This is what prevents the race condition.
    };
  }, []); // Empty array, runs only once on mount/unmount

  return (
    // We add a 'position: relative' container
    // for the button
    <div
      style={{
        width: "100%",
        height: "600px",
        border: "2px solid var(--border, #e5e7eb)",
        borderRadius: "12px",
        overflow: "hidden",
        position: "relative",
        // This is needed for the button to appear "on top"
        isolation: "isolate",
      }}
    >
     
      {/* The tldraw component */}
      <Tldraw
        // Pass our onMount callback
        onMount={handleMount}
        inferDarkMode={resolvedTheme === "dark"}
        autoFocus={false}
      />
    </div>
  );
}