"use client";

import { useAiStore } from "@/stores/aiStore";
import { Id } from "@/convex/_generated/dataModel";
import Chat from "@/components/ai/aipage";
import NotesPanel from "@/components/notescomponents/NotesPanel";
import { useParams } from "next/navigation";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useCanvasStore } from "@/stores/canvasStore";
import Canvas from "@/components/ai/canvas";

export default function ChatPage() {
  const { isCanvasOpen } = useCanvasStore();
  const params = useParams();

  const defaultChatSize = isCanvasOpen ? 40 : 100;

  return (
    <ResizablePanelGroup
      direction="horizontal"
      // 1. Add a subtle background to the whole group so the "Card" pops against it
      className="h-full w-full bg-muted/10"
    >
      <ResizablePanel defaultSize={defaultChatSize} minSize={40}>
        <div className="h-full overflow-y-auto">
          <Chat chatId={params.chatId as Id<"chats">} />
        </div>
      </ResizablePanel>

      {isCanvasOpen && (
        <>
          {/* 2. Style the Handle 
             The 'bg-transparent' makes it feel like empty space between the panels 
          */}
          <ResizableHandle withHandle={false} className="bg-transparent w-2" />

          <ResizablePanel
            defaultSize={60}
            minSize={30}
            className="hidden lg:block"
          >
            {/* 3. THE GEMINI CANVAS CONTAINER 
               - p-3: Adds the "Gap" between the handle/edges and the content.
               - h-full: Ensures it fills the height.
            */}
            <div className="h-full p-3 pl-0">
              {/* 4. THE ACTUAL "CARD"
                 - h-full w-full: Fill the container.
                 - bg-background/bg-card: The color of the "paper".
                 - rounded-3xl: This creates the heavy Gemini-style curves.
                 - border: A subtle outline definition.
                 - shadow-sm: Slight lift (optional).
                 - overflow-hidden: CRITICAL. Ensures the NotesPanel scrollbar 
                   respects the rounded corners.
              */}
              <div className="h-full w-full bg-background rounded-3xl border shadow-sm overflow-hidden flex flex-col">
                <Canvas />
              </div>
            </div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
