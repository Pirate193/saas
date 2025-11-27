"use client";

import { useAiStore } from "@/stores/aiStore";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
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
  MessageSquare,
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
  GenerateCodeSnippet,
  GenerateMermaidDiagram,
  GetFlashcard,
  GetFolderItems,
  GetUserFlashcards,
  LoadingCodeSnippet,
  LoadingMermaidDiagram,
  SourceGrid,
  UpdateNote,
  YouTubeEmbed,
} from "@/components/ai/tools";
import { UIMessage } from "ai";
import { ChatHistoryPopover } from "./chathistorymodal";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";

const suggestions: { key: string; value: string }[] = [
  { key: nanoid(), value: "Help with homework" },
  { key: nanoid(), value: "Create flashcards" },
  { key: nanoid(), value: "Explain a concept" },
  { key: nanoid(), value: "Quiz me" },
];
export default function AiModal() {
  const { isOpen, onClose, onOpen, setActiveChatId, activeChatId, context } =
    useAiStore();
  const [webSearch, setWebSearch] = useState(false);
  const { getToken } = useAuth();
  const createChat = useMutation(api.chat.createNewchat);
  //popover states
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [studyMode, setStudyMode] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [contextFolder, setContextFolder] = useState<Doc<"folders">[]>([]);
  const [contextNote, setContextNote] = useState<Doc<"notes">[]>([]);
  // +++ DATA FOR TAGGING UI +++
  const allFolders = useQuery(api.folders.fetchFolders);
  const allNotes = useQuery(api.notes.fetchNotes); // Fetches all notes

  // Filtered data for the command list

  const addMessage = useMutation(api.chat.addmessage);
  const initialMessages = useQuery(
    api.chat.getChat,
    activeChatId
      ? {
          chatId: activeChatId as Id<"chats">,
        }
      : "skip"
  );
  const [input, setInput] = useState("");
  const activeChatIdRef = useRef(activeChatId);
  const [pendingMessage, setPendingMessage] =
    useState<PromptInputMessage | null>(null);

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

  const defaultnote = useQuery(
    api.notes.getNoteId,
    context?.type === "note" ? { noteId: context.id as Id<"notes"> } : "skip"
  );
  const defaultfolder = useQuery(
    api.folders.getFolderById,
    context?.type === "folder"
      ? { folderId: context.id as Id<"folders"> }
      : "skip"
  );
  const hasSetDefaultFolder = useRef(false);
  useEffect(() => {
    // If the file's folder loads AND we haven't set a default yet...
    if (defaultnote && !hasSetDefaultFolder.current) {
      setContextNote([defaultnote]); // Set it as the default
      hasSetDefaultFolder.current = true; // Never run this again
    } else if (defaultfolder && !hasSetDefaultFolder.current) {
      setContextFolder([defaultfolder]); // Set it as the default
      hasSetDefaultFolder.current = true; // Never run this again
    }
  }, [defaultnote, defaultfolder]); // Only depends on fileFolder

  // Update the ref whenever activeChatId changes
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);
  const hasInitialized = useRef(false);
  const { messages, sendMessage, setMessages, status, regenerate, error } =
    useChat({
      id: (activeChatId as Id<"chats">) || undefined,
      onFinish: async (message) => {
        const currentChatId = activeChatIdRef.current;
        if (message.message.role === "assistant" && currentChatId) {
          const textContent = message.message.parts
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join("\n");
          await addMessage({
            chatId: currentChatId as Id<"chats">,
            role: message.message.role,
            content: textContent,
            parts: message.message.parts,
          });
        }
      },
    });
  useEffect(() => {
    if (initialMessages && !hasInitialized.current) {
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

  useEffect(() => {
    if (pendingMessage && activeChatId) {
      const sendPendingMessage = async () => {
        console.log("Sending pending message for chat:", activeChatId);
        const token = await getToken({ template: "convex" });

        sendMessage(
          {
            text: pendingMessage.text || "",
            files: pendingMessage.files,
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

        // Clear the pending message so this doesn't run again
        setPendingMessage(null);
      };

      sendPendingMessage();
    }
  }, [pendingMessage, activeChatId, sendMessage, getToken, webSearch, context]);

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }
    setInput("");
    let currentChatId = activeChatId;
    const messageText = message.text || "";
    if (!currentChatId) {
      console.log(" Creating new chat...");
      try {
        const title =
          messageText.slice(0, 50) + (messageText.length > 50 ? "..." : "");
        currentChatId = await createChat({ title });
        setActiveChatId(currentChatId);
        console.log(" Chat created:", currentChatId);
        await addMessage({
          chatId: currentChatId as Id<"chats">,
          role: "user",
          content: messageText || "",
          parts: [{ type: "text", text: message.text }],
        });

        setPendingMessage(message);
        return;
      } catch (error) {
        console.error("Failed to create chat:", error);
        return;
      }
    }

    const token = await getToken({ template: "convex" });
    try {
      await addMessage({
        chatId: currentChatId as Id<"chats">,
        role: "user",
        content: message.text || "",
        parts: [{ type: "text", text: message.text }],
      });
    } catch (error) {
      console.error("Failed to save user message:", error);
      return;
    }
    sendMessage(
      {
        text: message.text || "",
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
  };
  useEffect(() => {
    hasInitialized.current = false; // Allow the new chat to load
    setMessages([]); // Clear old messages immediately to avoid "ghosting"
  }, [activeChatId, setMessages]);

  return (
    <div className="flex flex-col h-full p-2 ">
      {/* header  */}
      <div className="flex items-center justify-between">
        <ChatHistoryPopover />
        <Button variant="ghost" onClick={() => onClose()}>
          <X className="size-4" />
        </Button>
      </div>
      {/* content  */}
      <Conversation>
        <ConversationContent className="">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<MessageSquare className="size-12" />}
              title="Start a conversation"
              description="Type a message below to begin chatting "
            />
          ) : (
            messages.map((message) => (
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
                      <Fragment key={`${message.id}-${i}`}>
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
                      </Fragment>
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
                  if (part.type === "tool-searchTheWeb") {
                    return (
                      <div key={`${message.id}-${i}`}>
                        {part.state === "input-available" && (
                          <div className="flex items-center gap-2">
                            <Spinner /> <p>Searching the Web</p>
                          </div>
                        )}
                        {part.state === "output-available" && (
                          <SourceGrid output={part.output} />
                        )}
                      </div>
                    );
                  }
                  if (part.type === "tool-getNoteContent") {
                    return (
                      <Tool key={`${message.id}-${i}`}>
                        <ToolHeader
                          state={part.state}
                          type="tool-getNoteContent"
                          title="Fetching Note Content"
                        />
                      </Tool>
                    );
                  }
                  if (part.type === "tool-generateCodeSnippet") {
                    return (
                      <div key={`${message.id}-${i}`}>
                        {part.state === "input-available" && (
                          <LoadingCodeSnippet title="Generating Code" />
                        )}
                        {part.state === "output-available" && (
                          <GenerateCodeSnippet output={part.output} />
                        )}
                      </div>
                    );
                  }
                  if (part.type === "tool-generateMermaidDiagram") {
                    return (
                      <div key={`${message.id}-${i}`}>
                        {part.state === "input-available" && (
                          <LoadingMermaidDiagram title="Generating Mermaid Diagram" />
                        )}
                        {part.state === "output-available" && (
                          <GenerateMermaidDiagram output={part.output} />
                        )}
                      </div>
                    );
                  }
                  if (part.type === "tool-youtubeVideo") {
                    return (
                      <div key={`${message.id}-${i}`}>
                        {part.state === "output-available" && (
                          <YouTubeEmbed output={part.output} />
                        )}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            ))
          )}
          {status === "submitted" && <Shimmer>Thinking...</Shimmer>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
        <PromptInputHeader>
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>

          {/* Display the selected context as a simple tag */}
          <PromptInputHoverCard
            open={popoverOpen}
            onOpenChange={setPopoverOpen}
          >
            <PromptInputHoverCardTrigger>
              <PromptInputButton
                className="h-8!"
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
            {/* study mode */}
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
  );
}
