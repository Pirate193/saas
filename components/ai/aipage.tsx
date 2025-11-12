"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
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
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputHoverCard,
  PromptInputHoverCardContent,
  PromptInputCommand,
  PromptInputCommandEmpty,
  PromptInputCommandGroup,
  PromptInputCommandInput,
  PromptInputCommandItem,
  PromptInputCommandList,
  PromptInputHoverCardTrigger,
} from "@/components/ai-elements/prompt-input";
import { Action, Actions } from "@/components/ai-elements/actions";
import { Fragment, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Response } from "@/components/ai-elements/response";
import {
  AtSignIcon,
  BookOpenIcon,
  BrainIcon,
  CopyIcon,
  Folder,
  GlobeIcon,
  Notebook,
  RefreshCcwIcon,
  X,
} from "lucide-react";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Loader } from "@/components/ai-elements/loader";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { nanoid } from "nanoid";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { Tool, ToolContent, ToolHeader } from "@/components/ai-elements/tool";
import {
  CreateFlashcard,
  CreateNote,
  GetFlashcard,
  GetFolderItems,
  GetUserFlashcards,
  UpdateNote,
} from "@/components/ai/tools";
import { FileUIPart, UIMessage } from "ai";
import { SidebarTrigger } from "../ui/sidebar";
import { ChatHistoryPopover } from "./chathistorypopover";
import { useAiStore } from "@/stores/aiStore";
import { toast } from "sonner";

interface Props {
  chatId: Id<"chats">;
}

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];
function validateFiles(files: FileUIPart[] | undefined): boolean {
  if (!files || files.length === 0) {
    return true; // No files to validate, so it's valid
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

const Chat = ({ chatId }: Props) => {
  const [input, setInput] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const initialMessages = useQuery(api.chat.getChat, { chatId: chatId }); //fetch the messages form convex
  const addMessage = useMutation(api.chat.addmessage);
  const updateChat = useMutation(api.chat.updateChat);
  const [contextFolder, setContextFolder] = useState<Doc<"folders">[]>(
    []
  );
  const [contextNote, setContextNote] = useState<Doc<"notes">[]>([]);
  
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [hasProcessedPendingMessage, setHasProcessedPendingMessage] =
    useState(false);

  const { getToken } = useAuth();
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
  const pendingMessageProcessedRef = useRef(false);
  
  const {body}=useAiStore()

  const pendingMessage = useAiStore((state) => state.pendingMessage);
  const setPendingMessage = useAiStore((state) => state.setPendingMessage);
  const hasInitialized = useRef(false);
  const { messages, sendMessage, status, regenerate, error, setMessages } =
    useChat({
      id: chatId,
      onFinish: async (message) => {
        if (message.message.role === "assistant") {
          const textContent = message.message.parts
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join("\n");
          await addMessage({
            chatId: chatId,
            role: message.message.role,
            content: textContent,
            parts: message.message.parts,
          });
        }
      },
    });

  useEffect(() => {
    if (
      initialMessages &&
      initialMessages.length > 0 &&
      !hasInitialized.current
    ) {
      hasInitialized.current = true;
      const transformedMessages = initialMessages.map((msg) => ({
        id: msg._id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        parts: msg.parts || [{ type: "text", text: msg.content }],
      }));

      setMessages(transformedMessages);
      console.log(" Loaded messages from Convex:", transformedMessages.length);
    }
  }, [initialMessages, setMessages]);

  const handleSubmit = async (message: PromptInputMessage) => {
    if (!validateFiles(message.files)) {
      return; // Stop execution if files are invalid
    }
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    const token = await getToken({ template: "convex" });
    try {
      await addMessage({
        chatId,
        role: "user",
        content: message.text || "",
        parts: [{ type: "text", text: message.text }],
      });
    } catch (error) {
      console.error("Failed to save user message:", error);
    }
    console.log('contextFolder',contextFolder)
    console.log('contextNote',contextNote)
    sendMessage(
      {
        text: message.text ||'',
        files: message.files,
      },
      {
        body: {
          webSearch: webSearch,
          contextFolder: contextFolder,
          convexToken: token,
          contextNote: contextNote,
          studyMode: studyMode,
          thinking: thinking,
        },
      }
    );
    setInput("");
  };
  useEffect(() => {
    const sendInitialMessage = async () => {
      // Check if there is a pending message and we haven't processed it yet
      if (
        pendingMessage &&
        !pendingMessageProcessedRef.current &&
        initialMessages &&
        initialMessages.length === 0
      ) {
        console.log("Sending pending message from store:", pendingMessage);
        pendingMessageProcessedRef.current = true;

        // Send the pending message
        const token = await getToken({ template: "convex" });
    try {
      await addMessage({
        chatId,
        role: "user",
        content: pendingMessage.text || "",
        parts: [{ type: "text", text: pendingMessage.text }],
      });
    } catch (error) {
      console.error("Failed to save user message:", error);
    }
    console.log('body',body)
    sendMessage(
      {
        text: pendingMessage.text ||'',
        files: pendingMessage.files,
      },
      {
        body: {
          webSearch: body.webSearch,
          contextFolder: body.contextFolder,
          convexToken: token,
          contextNote: body.contextNote,
          studyMode: body.studyMode,
          thinking: body.thinking,
        },
      }
    );

        // Clear the pending message from the store
        setPendingMessage(null);
        setHasProcessedPendingMessage(true);
      }
    };

    sendInitialMessage();
  }, [pendingMessage, initialMessages, setPendingMessage,body,]);
  return (
    <div className=" p-6 relative size-full ">
      <div className="flex flex-col h-full  ">
        <div className="flex items-center gap-2">
          <SidebarTrigger size="icon-lg" />
          <ChatHistoryPopover />
        </div>
        <Conversation>
          <ConversationContent className="" >
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === "assistant" &&
                  message.parts.filter((part) => part.type === "source-url")
                    .length > 0 && (
                    <Sources>
                      <SourcesTrigger
                        count={
                          message.parts.filter(
                            (part) => part.type === "source-url"
                          ).length
                        }
                      />
                      {message.parts
                        .filter((part) => part.type === "source-url")
                        .map((part, i) => (
                          <SourcesContent key={`${message.id}-${i}`}>
                            <Source
                              key={`${message.id}-${i}`}
                              href={part.url}
                              title={part.url}
                            />
                          </SourcesContent>
                        ))}
                    </Sources>
                  )}
                {message.parts.map((part, i) => {
                  if (part.type === "text") {
                    return (
                      <div key={`${message.id}-${i}`} className="w-full">
                        <Message from={message.role}>
                          <MessageContent>
                            <Response isAnimating={status === "streaming"}>
                              {part.text}
                            </Response>
                          </MessageContent>
                        </Message>
                        {message.role === "assistant" && (
                          <Actions className="mt-1">
                            {i === messages.length - 1 && (
                              <Action
                                onClick={() => regenerate()}
                                label="Retry"
                              >
                                <RefreshCcwIcon className="size-3" />
                              </Action>
                            )}
                            <Action
                              onClick={() =>
                                navigator.clipboard.writeText(part.text)
                              }
                              label="Copy"
                            >
                              <CopyIcon className="size-3" />
                            </Action>
                          </Actions>
                        )}
                      </div>
                    );
                  }
                  if (part.type === "reasoning") {
                    return (
                      <Reasoning
                        key={`${message.id}-${i}`}
                        className="w-full"
                        isStreaming={
                          status === "streaming" &&
                          i === message.parts.length - 1 &&
                          message.id === messages.at(-1)?.id
                        }
                      >
                        <ReasoningTrigger />
                        <ReasoningContent>{part.text}</ReasoningContent>
                      </Reasoning>
                    );
                  }

                  if (part.type === "tool-createNote") {
                    return (
                      <Tool key={`${message.id}-${i}`}>
                        <ToolHeader
                          state={part.state}
                          type="tool-createNote"
                          title="Creating Note"
                        />
                        <ToolContent>
                          {part.state === "output-available" && (
                            <CreateNote output={part.output} />
                          )}
                        </ToolContent>
                      </Tool>
                    );
                  }

                  if (part.type === "tool-updateNote") {
                    return (
                      <Tool key={`${message.id}-${i}`}>
                        <ToolHeader
                          state={part.state}
                          type="tool-updateNote"
                          title="Updating Note"
                        />
                        <ToolContent>
                          {part.state === "output-available" && (
                            <UpdateNote output={part.output} />
                          )}
                        </ToolContent>
                      </Tool>
                    );
                  }

                  if (part.type === "tool-generateFlashcards") {
                    return (
                      <Tool key={`${message.id}-${i}`}>
                        <ToolHeader
                          state={part.state}
                          type="tool-generateFlashcards"
                          title="Creating Flashcard"
                        />
                        <ToolContent>
                          {part.state === "output-available" && (
                            <CreateFlashcard output={part.output} />
                          )}
                        </ToolContent>
                      </Tool>
                    );
                  }

                  if (part.type === "tool-getfolderitems") {
                    return (
                      <Tool key={`${message.id}-${i}`}>
                        <ToolHeader
                          state={part.state}
                          type="tool-getfolderitems"
                          title="Analyzing Folder"
                        />
                        <ToolContent>
                          {part.state === "output-available" && (
                            <GetFolderItems output={part.output} />
                          )}
                        </ToolContent>
                      </Tool>
                    );
                  }

                  if (part.type === "tool-getUserFlashcards") {
                    return (
                      <Tool key={`${message.id}-${i}`}>
                        <ToolHeader
                          state={part.state}
                          type="tool-getUserFlashcards"
                          title="Fetching Flashcards"
                        />
                        <ToolContent>
                          {part.state === "output-available" && (
                            <GetUserFlashcards output={part.output} />
                          )}
                        </ToolContent>
                      </Tool>
                    );
                  }

                  if (part.type === "tool-getFlashcard") {
                    return (
                      <Tool key={`${message.id}-${i}`}>
                        <ToolHeader
                          state={part.state}
                          type="tool-getFlashcard"
                          title="Analyzing Flashcard"
                        />
                        <ToolContent>
                          {part.state === "output-available" && (
                            <GetFlashcard output={part.output} />
                          )}
                        </ToolContent>
                      </Tool>
                    );
                  }

                  return null;
                })}
              </div>
            ))}
            {status === "submitted" && <Shimmer>Thinking...</Shimmer>}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
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
              <button
                className="ml-1.5 p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation(); // Stop popover from opening
                  setContextFolder((prev) =>
                    prev.filter((f) => f._id !== folder._id)
                  );
                }}
              >
                <X size={12} />
              </button>
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
              <button
                className="ml-1.5 p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation(); // Stop popover from opening
                  setContextNote((prev) =>
                    prev.filter((n) => n._id !== note._id)
                  );
                }}
              >
                <X size={12} />
              </button>
            </PromptInputButton>
          ))}
          </PromptInputHeader>
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
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
            <PromptInputSubmit disabled={!input && !status} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};

export default Chat;
