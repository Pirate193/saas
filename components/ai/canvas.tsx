"use client";
import { useCanvasStore } from "@/stores/canvasStore";
import NotesPanel from "../notescomponents/NotesPanel";
import { CodePlayground } from "./codeplayground";

export default function Canvas() {
  const { activeView } = useCanvasStore();

  return (
    <div className="h-full w-full">
      {activeView === "note" && <NotesPanel />}

      {activeView === "video" && <div>Video</div>}

      {activeView === "code" && <CodePlayground />}

      {activeView === "idle" && (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          Select an item to view in the Canvas
        </div>
      )}
    </div>
  );
}
