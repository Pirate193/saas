'use client';

import { useAiStore } from '@/stores/aiStore';
import { Id } from '@/convex/_generated/dataModel';
import Chat from '@/components/ai/aipage';
import NotesPanel from '@/components/notescomponents/NotesPanel';
import { useParams } from 'next/navigation';

// Import the resizable components
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

export default function ChatPage() {
  const { isNotePanelOpen } = useAiStore();
  const params = useParams();

  // Determine the default size of the chat panel.
  // If the note panel is open, chat is 60%. If not, it's 100%.
  const defaultChatSize = isNotePanelOpen ? 60 : 100;

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full w-full"
    >
      <ResizablePanel defaultSize={defaultChatSize} minSize={40}>
        {/* This inner div is crucial.
          - h-full makes it fill the resizable panel.
          - overflow-y-auto gives the chat component its own scrollbar.
        */}
        <div className="h-full overflow-y-auto">
          <Chat chatId={params.chatId as Id<'chats'>} />
        </div>
      </ResizablePanel>

      {/* Conditionally render the handle and the note panel */}
      {isNotePanelOpen && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel
            defaultSize={40}
            minSize={30}
            className="hidden lg:block"
          >
            {/* This inner h-full is also crucial.
              The NotesPanel itself handles its own internal scrolling.
            */}
            <div className="h-full">
              <NotesPanel />
            </div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}