'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputCommand,
  PromptInputCommandEmpty,
  PromptInputCommandGroup,
  PromptInputCommandInput,
  PromptInputCommandItem,
  PromptInputCommandList,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputHoverCard,
  PromptInputHoverCardContent,
  PromptInputHoverCardTrigger,
  type PromptInputMessage,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { AtSignIcon, Folder, GlobeIcon, Sparkles, X } from 'lucide-react';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { nanoid } from 'nanoid';
import { Doc } from '@/convex/_generated/dataModel';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ChatHistoryPopover } from '@/components/ai/chathistorypopover';
import { toast } from 'sonner';
import { useAiStore } from '@/stores/aiStore';
import { FileUIPart } from 'ai';




// const suggestions: { key: string; value: string }[] = [
//   { key: nanoid(), value: 'Help with my homework' },
//   { key: nanoid(), value: 'Help me study for my biology exam' },
//   { key: nanoid(), value: 'Create 10 flashcards about Machine Learning' },
//   { key: nanoid(), value: 'Explain the K-Means algorithm' },
// ];
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
function validateFiles(files: FileUIPart[] | undefined): boolean {
  if (!files || files.length === 0) {
    return true; // No files to validatse, so it's valid
  }

  for (const file of files) {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error(`Invalid file type: ${file.filename}`, {
        description: 'Only images (PNG, JPG, WEBP, GIF) and PDFs are allowed.',
      });
      return false; // Found an invalid file
    }
  }
  return true; // All files are valid
}
export default function NewChatPage() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const createChat = useMutation(api.chat.createNewchat); // Updated to api.chats
  const router = useRouter();

  // --- ADDED: Missing state from your JSX ---
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [contextFolder, setContextFolder] = useState<Doc<'folders'> | null>(
    null,
  );
  const setPendingMessage = useAiStore((state) => state.setPendingMessage);
  // ---

  // --- ADDED: Missing data-fetching for your JSX ---
  const allfolders = useQuery(api.folders.fetchFolders);
  const filteredFolders = allfolders?.filter(folder =>
    folder.name.toLowerCase().includes(search.toLowerCase()),
  );
  // ---

  const handleSubmit = async (message: PromptInputMessage) => {
   
    if (!message.text?.trim()) return;
     if (!validateFiles(message.files)) {
      return; // Stop execution if files are invalid
    }
   

    setIsLoading(true);
    try {
      const title =
        message.text.slice(0, 50) + (message.text.length > 50 ? '...' : '');
      const chatId = await createChat({ title });

      setPendingMessage(message);
     
      router.push(`/Ai/${chatId}`);
    } catch (error) {
      console.error('Failed to create chat:', error);
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    // --- UPDATED: Changed layout to push input to bottom ---
    <div className="flex flex-col h-full max-w-4xl  p-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger size="icon-lg" />
        <ChatHistoryPopover />
      </div>

      {/* This makes the content take up all space, pushing the input down */}
      <div className="flex-1 flex flex-col justify-center items-center space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Sparkles className="size-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">How can I help you today?</h1>
        </div>

        
      </div>


      
      {/* <Suggestions className='' >
          {suggestions.map(suggestion => (
            <Suggestion
              key={suggestion.key}
              onClick={handleSuggestionClick}
              suggestion={suggestion.value}
            />
          ))}
        </Suggestions> */}
       

      {/* --- ADDED: Provider and wrapper div for the input --- */}
      <PromptInputProvider>
        <div className="w-full">
          <PromptInput
            onSubmit={handleSubmit}
            className="mt-4"
            globalDrop
            multiple
          >
            <PromptInputHeader>
                 <PromptInputAttachments>
                            {(attachment) => <PromptInputAttachment data={attachment} />}
                          </PromptInputAttachments>
              <PromptInputHoverCard
                open={popoverOpen}
                onOpenChange={setPopoverOpen}
              >
                <PromptInputHoverCardTrigger>
                  <PromptInputButton
                    className="!h-8"
                    size="icon-sm"
                    variant="outline"
                  >
                    <AtSignIcon className="text-muted-foreground" size={12} />
                  </PromptInputButton>
                </PromptInputHoverCardTrigger>
                <PromptInputHoverCardContent className="w-[400px] p-0">
                  <PromptInputCommand>
                    <PromptInputCommandInput
                      className="border-none focus-visible:ring-0"
                      placeholder="Add files, folders, docs..."
                      value={search}
                      onValueChange={setSearch}
                    />
                    <PromptInputCommandList>
                      <PromptInputCommandEmpty className="p-3 text-muted-foreground text-sm">
                        {allfolders === undefined
                          ? 'Loading...'
                          : 'No folders found.'}
                      </PromptInputCommandEmpty>

                      {contextFolder && (
                        <PromptInputCommandGroup heading="Added">
                          <PromptInputCommandItem
                            onSelect={() => {
                              setContextFolder(null);
                              setPopoverOpen(false);
                            }}
                          >
                            <Folder />
                            <span>{contextFolder.name}</span>
                            <span className="ml-auto">
                              <X className="size-4" />
                            </span>
                          </PromptInputCommandItem>
                        </PromptInputCommandGroup>
                      )}

                      <PromptInputCommandGroup heading="Folders">
                        {filteredFolders?.map(folder => (
                          <PromptInputCommandItem
                            key={folder._id}
                            onSelect={() => {
                              setContextFolder(folder); // Corrected typo
                              setPopoverOpen(false);
                              setSearch('');
                            }}
                          >
                            <Folder className="text-primary" />
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">
                                {folder.name}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {folder.description || 'No description'}
                              </span>
                            </div>
                          </PromptInputCommandItem>
                        ))}
                      </PromptInputCommandGroup>
                    </PromptInputCommandList>
                  </PromptInputCommand>
                </PromptInputHoverCardContent>
              </PromptInputHoverCard>

              {contextFolder && !popoverOpen && (
                <PromptInputButton
                  size="sm"
                  variant="outline"
                  onClick={() => setPopoverOpen(true)}
                >
                  <Folder size={12} />
                  <span>{contextFolder.name}</span>
                </PromptInputButton>
              )}
            </PromptInputHeader>
            <PromptInputBody>
              <PromptInputTextarea
                placeholder={
                  contextFolder
                    ? `Ask about "${contextFolder.name}"...`
                    : 'Plan, search, build anything'
                }
                value={input}
                onChange={(e)=>setInput(e.target.value)}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                 <PromptInputActionMenu>
                                <PromptInputActionMenuTrigger />
                                <PromptInputActionMenuContent>
                                  <PromptInputActionAddAttachments />
                                </PromptInputActionMenuContent>
                    </PromptInputActionMenu>
              </PromptInputTools>
              <PromptInputSubmit
                disabled={!input || isLoading} // Updated disabled logic
                status={isLoading ? 'submitted' : 'ready'}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </PromptInputProvider>
    </div>
  );
}