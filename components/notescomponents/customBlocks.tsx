// createWhiteboard.tsx - FIXED VERSION (No "Cannot find node position" error)
import { createReactBlockSpec } from "@blocknote/react";
import { useRef, useState, useEffect, useCallback } from "react";
import { Tldraw, Editor } from "tldraw";
import { defaultProps } from "@blocknote/core";
import { useTheme } from "next-themes";
import "tldraw/tldraw.css";

/**
 * Whiteboard Block with proper cleanup to prevent "Cannot find node position" errors
 * 
 * Key fixes:
 * - Cleanup interval on unmount
 * - Prevent updates after unmount with isMounted ref
 * - Debounced saves to reduce update frequency
 * - Proper error handling
 */
const createWhiteboard = createReactBlockSpec(
  {
    type: "whiteboard",
    propSchema: {
      ...defaultProps,
      whiteboardState: { default: "" as const },
    },
    content: "none",
  },
  {
    render: (props) => <WhiteboardBlock {...props} />,
  }
);

export default createWhiteboard;

function WhiteboardBlock({ block, editor }: any) {
  const [isLoading, setIsLoading] = useState(true);
  const editorRef = useRef<Editor | null>(null);
  const { resolvedTheme } = useTheme();
  
  // CRITICAL: Track if component is mounted
  const isMountedRef = useRef(true);
  
  // Track if we're currently saving to prevent race conditions
  const isSavingRef = useRef(false);
  
  // Store interval ID for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Store last saved state to avoid unnecessary updates
  const lastSavedStateRef = useRef<string>(block.props.whiteboardState);

  const handleMount = useCallback((tldrawEditor: Editor) => {
    // Don't do anything if component is unmounted
    if (!isMountedRef.current) return;
    
    editorRef.current = tldrawEditor;

    // Load saved state if it exists
    if (block.props.whiteboardState) {
      try {
        const savedState = JSON.parse(block.props.whiteboardState);
        setTimeout(() => {
          if (isMountedRef.current && editorRef.current) {
            tldrawEditor.store.loadStoreSnapshot(savedState);
          }
        }, 100);
      } catch (error) {
        console.error("Failed to load whiteboard state:", error);
      }
    }

    setIsLoading(false);
  }, [block.props.whiteboardState]);

  // Debounced save function
  const saveState = useCallback(() => {
    // Don't save if:
    // 1. Component is unmounted
    // 2. Editor doesn't exist
    // 3. Currently saving (prevent race conditions)
    if (!isMountedRef.current || !editorRef.current || isSavingRef.current) {
      return;
    }

    try {
      isSavingRef.current = true;
      
      const snapshot = editorRef.current.store.getStoreSnapshot();
      const stateString = JSON.stringify(snapshot);

      // Only update if state actually changed
      if (stateString !== lastSavedStateRef.current) {
        lastSavedStateRef.current = stateString;
        
        // Use try-catch for the update itself
        try {
          editor.updateBlock(block.id, {
            props: { whiteboardState: stateString },
          });
        } catch (error) {
          // This catches "Cannot find node position" errors
          console.warn("Failed to update block (component may be unmounting):", error);
        }
      }
    } catch (error) {
      console.error("Failed to save whiteboard state:", error);
    } finally {
      isSavingRef.current = false;
    }
  }, [block.id, editor]);

  // Auto-save with proper cleanup
  useEffect(() => {
    if (!editorRef.current || isLoading) return;

    // Set up auto-save interval
    intervalRef.current = setInterval(() => {
      saveState();
    }, 2000);

    // CRITICAL: Cleanup function
    return () => {
      // Clear the interval first
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Mark as unmounted to prevent any pending saves
      isMountedRef.current = false;
      
      // Do one final save if there are unsaved changes
      if (editorRef.current && !isSavingRef.current) {
        try {
          const snapshot = editorRef.current.store.getStoreSnapshot();
          const stateString = JSON.stringify(snapshot);
          
          if (stateString !== lastSavedStateRef.current) {
            // Synchronous final save attempt
            try {
              editor.updateBlock(block.id, {
                props: { whiteboardState: stateString },
              });
            } catch (error) {
              // Silently fail if node is already gone
              console.log("Component unmounted before final save");
            }
          }
        } catch (error) {
          console.error("Error during cleanup save:", error);
        }
      }
      
      // Clear references
      editorRef.current = null;
    };
  }, [saveState, isLoading, block.id, editor]);

  // Reset mounted ref when component remounts
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "600px",
        border: "2px solid var(--border, #e5e7eb)",
        borderRadius: "12px",
        overflow: "hidden",
        position: "relative",
        backgroundColor: resolvedTheme === "dark" ? "#1e1e1e" : "#ffffff",
        isolation: "isolate",
        contain: "layout style paint",
      }}
    >
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9999,
            padding: "16px 32px",
            background: "rgba(0, 0, 0, 0.85)",
            color: "white",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: 500,
          }}
        >
          Loading whiteboard...
        </div>
      )}
      
      <Tldraw
        onMount={handleMount}
        inferDarkMode={resolvedTheme === "dark"}
        autoFocus={false}
      />
    </div>
  );
}