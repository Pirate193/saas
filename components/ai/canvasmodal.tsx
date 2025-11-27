"use client";
import NotesPanel from "../notescomponents/NotesPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useCanvasStore } from "@/stores/canvasStore";
import { CodePlayground } from "./codeplayground";
import { WhiteboardCanvas } from "./Aiwhiteboard";
import { MermaidDiagram } from "./mermaid";
import { VideoPanel } from "./canvas";

const CanvasModal = () => {
  const { activeView, setCanvasOpen, isCanvasOpen } = useCanvasStore();
  return (
    <Dialog open={isCanvasOpen} onOpenChange={setCanvasOpen}>
      <DialogContent className=" max-h-[calc(100vh-2rem)]   md:max-w-[700px] lg:max-w-[800px] overflow-y-auto scrollbar-hidden">
        <DialogHeader>
          <DialogTitle>Canvas</DialogTitle>
        </DialogHeader>
        <div className="">
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
      </DialogContent>
    </Dialog>
  );
};

export default CanvasModal;
