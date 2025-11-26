"use client";
import { useCanvasStore } from "@/stores/canvasStore";
import NotesPanel from "../notescomponents/NotesPanel";
import { CodePlayground } from "./codeplayground";
import { WhiteboardCanvas } from "./Aiwhiteboard";
import { MermaidDiagram } from "./mermaid";

export default function Canvas() {
  const { activeView } = useCanvasStore();

  return (
    <div className="h-full w-full">
      {activeView === "note" && <NotesPanel />}

      {activeView === "video" && <div>Video</div>}

      {activeView === "code" && <CodePlayground />}
      {activeView === "whiteboard" && <WhiteboardCanvas />}
      {activeView === "mermaid" && <MermaidDiagram />}

      {activeView === "idle" && (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          Select an item to view in the Canvas
        </div>
      )}
    </div>
  );
}
