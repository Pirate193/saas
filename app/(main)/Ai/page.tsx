"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
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
} from "@/components/ai-elements/prompt-input";
import {
  AtSignIcon,
  BookOpenIcon,
  BrainIcon,
  Folder,
  GlobeIcon,
  Notebook,
  Sparkles,
  X,
} from "lucide-react";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { nanoid } from "nanoid";
import { Doc } from "@/convex/_generated/dataModel";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ChatHistoryPopover } from "@/components/ai/chathistorypopover";
import { toast } from "sonner";
import { useAiStore } from "@/stores/aiStore";
import { FileUIPart } from "ai";
import { UsageLimitModal } from "@/components/subscription/usage-limit-modal";
import Ailimit from "@/components/subscription/ailimit-banner";

const suggestions: { key: string; value: string }[] = [
  { key: nanoid(), value: "Help with my homework" },
  { key: nanoid(), value: "Help me study for my biology exam" },
  { key: nanoid(), value: "Create 10 flashcards about Machine Learning" },
  { key: nanoid(), value: "Explain the K-Means algorithm" },
];
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];
function validateFiles(files: FileUIPart[] | undefined): boolean {
  if (!files || files.length === 0) {
    return true; // No files to validatse, so it's valid
  }

  for (const file of files) {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error(`Invalid file type: ${file.filename}`, {
        description: "Only images (PNG, JPG, WEBP, GIF) and PDFs are allowed.",
      });
      return false; // Found an invalid file
    }
  }
  return true; // All files are valid
}
export default function NewChatPage() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const createChat = useMutation(api.chat.createNewchat);
  const generateSmartTitle = useAction(api.chat.generateChatTitle);
  const router = useRouter();
  const { setBody } = useAiStore();

  // --- ADDED: Missing state from your JSX ---
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [contextFolder, setContextFolder] = useState<Doc<"folders">[]>([]);
  const [contextNote, setContextNote] = useState<Doc<"notes">[]>([]);
  const setPendingMessage = useAiStore((state) => state.setPendingMessage);
  const canchat = useQuery(api.subscriptions.canUseAiChat); // can the user use ai
  const [IslimitModalOpen, setIsLimitModalOpen] = useState(false); //to open the limited modal
  // ---

  const allFolders = useQuery(api.folders.fetchFolders);
  const allNotes = useQuery(api.notes.fetchNotes); // Fetches all notes

  // Filtered data for the command list
  const filteredFolders = allFolders?.filter(
    (folder) =>
      !contextFolder.find((cf) => cf._id === folder._id) && // Hide tagged
      folder.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredNotes = allNotes?.filter(
    (note) =>
      !contextNote.find((cn) => cn._id === note._id) && // Hide tagged
      note.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (message: PromptInputMessage) => {
    if (!message.text?.trim()) return;
    //  if (!validateFiles(message.files)) {
    //   return; // Stop execution if files are invalid
    // }
    const access = canchat?.allowed;
    if (!access) {
      setIsLimitModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const title =
        message.text.slice(0, 50) + (message.text.length > 50 ? "..." : "");
      const chatId = await createChat({ title });

      generateSmartTitle({
        chatId,
        userPrompt: message.text,
      });

      setPendingMessage(message);
      setBody({
        webSearch,
        studyMode,
        thinking,
        contextFolder,
        contextNote,
      });

      router.push(`/Ai/${chatId}`);
    } catch (error) {
      console.error("Failed to create chat:", error);
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    // --- UPDATED: Changed layout to push input to bottom ---
    <div className="flex flex-col h-full  p-6">
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

      <Suggestions className="flex-wrap">
        {suggestions.map((suggestion) => (
          <Suggestion
            key={suggestion.key}
            // This ensures the string value is passed to your handler
            onClick={() => handleSuggestionClick(suggestion.value)}
            suggestion={suggestion.value}
          />
        ))}
      </Suggestions>
      {!canchat?.allowed && <Ailimit />}
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
                      placeholder="Add folders or notes..."
                      value={search}
                      onValueChange={setSearch}
                    />
                    <PromptInputCommandList>
                      <PromptInputCommandEmpty className="p-3 text-muted-foreground text-sm">
                        {allFolders === undefined || allNotes === undefined
                          ? "Loading..."
                          : "No items found."}
                      </PromptInputCommandEmpty>

                      {/* Added Context (from arrays) */}
                      {(contextFolder.length > 0 || contextNote.length > 0) && (
                        <PromptInputCommandGroup heading="Added">
                          {contextFolder.map((folder) => (
                            <PromptInputCommandItem
                              key={folder._id}
                              value={folder._id}
                              onSelect={() => {
                                setContextFolder((prev) =>
                                  prev.filter((f) => f._id !== folder._id)
                                );
                                setPopoverOpen(false);
                              }}
                            >
                              <Folder />
                              <span>{folder.name}</span>
                              <span className="ml-auto">
                                <X className="size-4" />
                              </span>
                            </PromptInputCommandItem>
                          ))}
                          {contextNote.map((note) => (
                            <PromptInputCommandItem
                              key={note._id}
                              value={note._id}
                              onSelect={() => {
                                setContextNote((prev) =>
                                  prev.filter((n) => n._id !== note._id)
                                );
                                setPopoverOpen(false);
                              }}
                            >
                              <Notebook />
                              <span>{note.title}</span>
                              <span className="ml-auto">
                                <X className="size-4" />
                              </span>
                            </PromptInputCommandItem>
                          ))}
                        </PromptInputCommandGroup>
                      )}

                      {/* Folders (adds to array) */}
                      <PromptInputCommandGroup heading="Folders">
                        {filteredFolders?.map((folder) => (
                          <PromptInputCommandItem
                            key={folder._id}
                            value={folder._id}
                            onSelect={() => {
                              setContextFolder((prev) => [...prev, folder]);
                              setPopoverOpen(false);
                              setSearch("");
                            }}
                          >
                            <Folder className="text-primary" />
                            <span className="font-medium text-sm">
                              {folder.name}
                            </span>
                          </PromptInputCommandItem>
                        ))}
                      </PromptInputCommandGroup>

                      {/* Notes (adds to array) */}
                      <PromptInputCommandGroup heading="Notes">
                        {filteredNotes?.map((note) => (
                          <PromptInputCommandItem
                            key={note._id}
                            value={note._id}
                            onSelect={() => {
                              setContextNote((prev) => [...prev, note]);
                              setPopoverOpen(false);
                              setSearch("");
                            }}
                          >
                            <Notebook className="text-primary" />
                            <span className="font-medium text-sm">
                              {note.title}
                            </span>
                          </PromptInputCommandItem>
                        ))}
                      </PromptInputCommandGroup>
                    </PromptInputCommandList>
                  </PromptInputCommand>
                </PromptInputHoverCardContent>
              </PromptInputHoverCard>

              {/* +++ 3. "X" ON TAGS UI +++ */}
              {/* Tags for selected folders */}
              {contextFolder.map((folder) => (
                <PromptInputButton
                  key={folder._id}
                  size="sm"
                  variant="outline"
                  className="group max-w-[150px]"
                >
                  <Folder size={12} className="mr-1.5 shrink-0" />
                  <span className="truncate">{folder.name}</span>
                  <span
                    role="button"
                    className="ml-1.5 p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation(); // Stop popover from opening
                      setContextFolder((prev) =>
                        prev.filter((f) => f._id !== folder._id)
                      );
                    }}
                  >
                    <X size={12} />
                  </span>
                </PromptInputButton>
              ))}
              {/* Tags for selected notes */}
              {contextNote.map((note) => (
                <PromptInputButton
                  key={note._id}
                  size="sm"
                  variant="outline"
                  className="group max-w-[150px]"
                >
                  <Notebook size={12} className="mr-1.5 shrink-0" />
                  <span className="truncate">{note.title}</span>
                  <span
                    role="button"
                    className="ml-1.5 p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation(); // Stop popover from opening
                      setContextNote((prev) =>
                        prev.filter((n) => n._id !== note._id)
                      );
                    }}
                  >
                    <X size={12} />
                  </span>
                </PromptInputButton>
              ))}
            </PromptInputHeader>
            <PromptInputBody>
              <PromptInputTextarea
                placeholder={
                  contextFolder.length > 0 || contextNote.length > 0
                    ? `Ask about "${contextFolder.map((folder) => folder.name).join(", ")}" or "${contextNote.map((note) => note.title).join(", ")}"...`
                    : "Plan, search, build anything"
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
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
                <PromptInputButton
                  variant={webSearch ? "default" : "ghost"}
                  onClick={() => setWebSearch(!webSearch)}
                >
                  <GlobeIcon size={16} />
                  <span>Search</span>
                </PromptInputButton>
                <PromptInputButton
                  variant={studyMode ? "default" : "ghost"}
                  onClick={() => setStudyMode(!studyMode)}
                >
                  <BookOpenIcon size={16} />
                  <span>Study</span>
                </PromptInputButton>
                <PromptInputButton
                  variant={thinking ? "default" : "ghost"}
                  onClick={() => setThinking(!thinking)}
                >
                  <BrainIcon size={16} />
                  <span>Thinking</span>
                </PromptInputButton>
              </PromptInputTools>
              <PromptInputSubmit
                disabled={!input || isLoading} // Updated disabled logic
                status={isLoading ? "submitted" : "ready"}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </PromptInputProvider>
      <UsageLimitModal
        isOpen={IslimitModalOpen}
        onOpenChange={setIsLimitModalOpen}
        limitType="tokens"
        tokensLimit={canchat?.aiTokensLimit}
        tokensUsed={canchat?.aiTokens}
      />
    </div>
  );
}
