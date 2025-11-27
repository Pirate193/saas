"use client";
import { useCanvasStore } from "@/stores/canvasStore";
import NotesPanel from "../notescomponents/NotesPanel";
import { CodePlayground } from "./codeplayground";
import { WhiteboardCanvas } from "./Aiwhiteboard";
import { MermaidDiagram } from "./mermaid";
import { X } from "lucide-react";
import { Button } from "../ui/button";

export default function Canvas() {
  const { activeView } = useCanvasStore();

  return (
    <div className="h-full w-full">
      {activeView === "note" && <NotesPanel />}

      {activeView === "video" && <VideoPanel />}

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

export const VideoPanel = () => {
  const { activeVideoId, setCanvasOpen } = useCanvasStore();
  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-4 bg-accent flex items-center justify-between">
        <p>{activeVideoId?.title}</p>
        <Button onClick={() => setCanvasOpen(false)}>
          <X />
        </Button>
      </div>
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${activeVideoId?.videoId}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="border-0"
      />
    </div>
  );
};
