"use client";
import { Id } from "@/convex/_generated/dataModel";
import Dashboard from "./dashboard";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useParams } from "next/navigation";
import { useAiStore } from "@/stores/aiStore";
import AiModal from "@/components/ai/aimodal";
import { AiTriggerButton } from "@/components/ai/aiModaltrigger";

export default function FolderPage() {
  const params = useParams();
  const folderId = params.folderId;
  const { isOpen } = useAiStore();
  return (
    <div className="flex-1 overflow-hidden">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={60} minSize={50} className="h-full">
          <div className="flex-1 overflow-y-auto scrollbar-hidden h-full">
            <Dashboard folderId={folderId as Id<"folders">} />
            {!isOpen && (
              <AiTriggerButton
                context={{
                  type: "folder",
                  id: folderId as Id<"folders">,
                  name: "",
                }}
              />
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
              minSize={30}
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
    </div>
  );
}
