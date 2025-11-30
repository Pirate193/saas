"use client";
import { AiTriggerButton } from "@/components/ai/aiModaltrigger";
import Notecomponent from "@/components/notescomponents/noteComponent";
import Notesheader from "@/components/notescomponents/notesheader";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useAiStore } from "@/stores/aiStore";
import AiModal from "@/components/ai/aimodal";
import CanvasModal from "@/components/ai/canvasmodal";
const Notespage = () => {
  const params = useParams();
  const noteId = params.noteId;
  const note = useQuery(api.notes.getNoteId, { noteId: noteId as Id<"notes"> });
  const { isOpen } = useAiStore();
  return (
    <div className="h-full flex flex-col dark:bg-[#1f1f1f] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden  ">
      <Notesheader noteId={noteId as Id<"notes">} />
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={60} minSize={50} className="h-full">
          <div className="flex-1 overflow-y-auto scrollbar-hidden h-full">
            <Notecomponent noteId={noteId as Id<"notes">} />
            {note && (
              <div className="absolute bottom-2 right-2 flex items-center gap-2 text-xs text-muted-foreground justify-end pt-2 ">
                <span>
                  Last edited: {new Date(note.updatedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </ResizablePanel>
        {isOpen && (
          <>
            <ResizableHandle
              withHandle={false}
              className="bg-transparent w-2"
            />
            <ResizablePanel
              defaultSize={40}
              minSize={40}
              className="hidden lg:block"
            >
              <div className="h-full p-3 pl-0">
                <div className="h-full w-full bg-background rounded-3xl border shadow-sm overflow-hidden flex flex-col">
                  <AiModal />
                </div>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
      <CanvasModal />
    </div>
  );
};

export default Notespage;
