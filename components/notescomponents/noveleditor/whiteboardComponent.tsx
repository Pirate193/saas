"use client";

import { NodeViewWrapper } from "@tiptap/react";
import { Tldraw, createTLStore, defaultShapeUtils } from "tldraw";
import "tldraw/tldraw.css";
import { useEffect, useState } from "react";
import { Maximize2, Minimize2, Trash2 } from "lucide-react";

interface WhiteboardComponentProps {
  node: {
    attrs: {
      data: string;
    };
  };
  updateAttributes: (attrs: any) => void;
  deleteNode: () => void;
}

const WhiteboardComponent = ({
  node,
  updateAttributes,
  deleteNode,
}: WhiteboardComponentProps) => {
  const [store] = useState(() => createTLStore({ shapeUtils: defaultShapeUtils }));
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Load initial data
    if (node.attrs.data && node.attrs.data !== "{}") {
      try {
        const snapshot = JSON.parse(node.attrs.data);
        store.loadStoreSnapshot(snapshot);
      } catch (error) {
        console.error("Error loading whiteboard data:", error);
      }
    }

    // Auto-save every 2 seconds
    const interval = setInterval(() => {
      const snapshot = store.getStoreSnapshot();
      updateAttributes({ data: JSON.stringify(snapshot) });
    }, 2000);

    return () => clearInterval(interval);
  }, [store, updateAttributes, node.attrs.data]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <NodeViewWrapper
      className={`whiteboard-wrapper ${isFullscreen ? "fullscreen" : ""}`}
      data-drag-handle
    >
      <div className="whiteboard-container group relative">
        {/* Toolbar */}
        <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-white rounded shadow hover:bg-gray-100"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={deleteNode}
            className="p-2 bg-white rounded shadow hover:bg-red-100"
            title="Delete whiteboard"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>

        {/* TLDraw Canvas */}
        <div className={`whiteboard-canvas ${isFullscreen ? "fullscreen-canvas" : ""}`}>
          <Tldraw store={store} />
        </div>
      </div>

      <style jsx global>{`
        .whiteboard-wrapper {
          width: 100%;
          margin: 1rem 0;
        }

        .whiteboard-wrapper.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          margin: 0;
          background: white;
        }

        .whiteboard-container {
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          background: white;
        }

        .whiteboard-canvas {
          width: 100%;
          height: 500px;
          position: relative;
        }

        .fullscreen-canvas {
          height: 100vh !important;
        }

        /* Hide tldraw watermark - requires license for production */
        .tl-watermark {
          display: none !important;
        }
      `}</style>
    </NodeViewWrapper>
  );
};

export default WhiteboardComponent;