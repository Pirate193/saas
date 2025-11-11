"use client";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { UIMessage, useChat } from "@ai-sdk/react";
import { useAction, useMutation, useQuery } from "convex/react";
import React, { Fragment, useEffect, useRef, useState } from "react";
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
  PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "../ai-elements/prompt-input";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "../ai-elements/conversation";
import { Message, MessageContent } from "../ai-elements/message";
import { Response } from "../ai-elements/response";
import { Action, Actions } from "../ai-elements/actions";
import {
  AtSignIcon,
  CopyIcon,
  Folder,
  MessageSquare,
  Notebook,
  RefreshCcwIcon,
  X,
} from "lucide-react";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "../ai-elements/reasoning";
import { Shimmer } from "../ai-elements/shimmer";
import { useAuth } from "@clerk/nextjs";
import extractTextFromPDF from "@/lib/pdfparse";
import { useThreadMessages, useUIMessages } from "@convex-dev/agent/react";
import { toUIMessages } from "@convex-dev/agent";
import { set } from "date-fns";
import { title } from "process";
import { error } from "console";
import { toast } from "sonner";
import { useAiStore } from "@/stores/aiStore";
import { DefaultChatTransport } from "ai";
import { ChatHistoryPopover } from "../ai/chathistorymodal";
import { CreateFlashcard, CreateNote, GetFlashcard, GetFolderItems, GetUserFlashcards, UpdateNote } from "../ai/tools";
import { Tool, ToolContent, ToolHeader } from "../ai-elements/tool";
interface ChatwithpdfProps {
  fileId: Id<"files">;
}
const Chatwithpdf = ({ fileId }: ChatwithpdfProps) => {
  const file = useQuery(api.files.getFile, { fileId: fileId });
  const [input, setInput] = useState("");
  const folder = useQuery(api.folders.getFolderById, {
    folderId: file?.file.folderId as Id<"folders">,
  });
  const { activeChatId, setActiveChatId } = useAiStore();
  const addMessage = useMutation(api.chat.addmessage);
  const createChat = useMutation(api.chat.createNewchat);
  //initial messages from conex
  const initialMessages = useQuery(
    api.chat.getChat,
    activeChatId ? { chatId: activeChatId as Id<"chats"> } : "skip"
  );
  //now lets use a ref to refernce our activeChatId
  const activeChatIdRef = useRef(activeChatId);
  // lets use store also the first message from user as pending message
  const [pendingMessage, setPendingMessage] =
    useState<PromptInputMessage | null>(null);

  //lets use effect to update our ref whenevr activeChatId changes
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);
  //popover states
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [contextFolder, setContextFolder] = useState<Doc<"folders">[]>([]);
  const [contextNote, setContextNote] = useState<Doc<"notes">[]>([]);
  // +++ DATA FOR TAGGING UI +++
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

  // Get the single folder for this file (used as default, can be overridden)
  const fileFolder = useQuery(api.folders.getFolderById, {
    folderId: file?.file.folderId as Id<"folders">,
  });

  // Set the file's containing folder as the default context
  const hasSetDefaultFolder = useRef(false);
  useEffect(() => {
    // If the file's folder loads AND we haven't set a default yet...
    if (fileFolder && !hasSetDefaultFolder.current) {
      setContextFolder([fileFolder]); // Set it as the default
      hasSetDefaultFolder.current = true; // Never run this again
    }
  }, [fileFolder]); // Only depends on fileFolder
  const { messages, sendMessage, setMessages, status, regenerate, error } =
    useChat({
      transport: new DefaultChatTransport({ api: "/api/chatwithpdf" }),
      id: (activeChatId as Id<"chats">) || undefined,
      onFinish: async (message) => {
        const currentChatId = activeChatIdRef.current; // get the current chatId from the ref
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

  const { getToken } = useAuth();
  //now lets use a use effect to initialize our messages from convex once
  
  const hasInitialized = useRef(false);
  useEffect(() => {
    // When activeChatId changes, it means we have a new chat.
    // We must reset our "hasInitialized" flag to `false`.
    // This gives the *other* effect permission to run.
    hasInitialized.current = false;
  }, [activeChatId]);
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
      })) as UIMessage[];
      setMessages(transformedMessages);
      console.log(" Loaded messages from Convex:", transformedMessages.length);
    }
  }, [initialMessages, setMessages, activeChatId]);

  //now it is the pending message turn to send the message to convex
    const pendingMessageProcessedRef = useRef(false);
  useEffect(() => {
    if (pendingMessage && activeChatId && !pendingMessageProcessedRef.current) {
      const sendPendingMessage = async () => {
        pendingMessageProcessedRef.current = true;
        console.log("Sending pending message for chat:", activeChatId);
        const token = await getToken({ template: "convex" });
        const text = await extractTextFromPDF(file?.fileurl as string);
        sendMessage(
          {
            text: pendingMessage.text || "",
            files: pendingMessage.files,
          },
          {
            body: {
              convexToken: token,
              contextFolder: contextFolder,
              contextNote: contextNote,
              pdfText: text,
              fileDetails: {
                fileName: file?.file.fileName,
                fileType: file?.file.fileType,
              },
            },
          }
        );
        setPendingMessage(null);
      };
      sendPendingMessage();
    }
  }, [pendingMessage, sendMessage, activeChatId, getToken]);

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) {
      return;
    }
    setInput("");
    let currentchatId = activeChatId;
    const messageText = message.text || "";
    if (!currentchatId) {
      try {
        const title =
          messageText.slice(0, 50) + (messageText.length > 50 ? "..." : "");
        currentchatId = await createChat({ title });
        setActiveChatId(currentchatId);
        console.log(" Chat created:", currentchatId);
        await addMessage({
          chatId: currentchatId as Id<"chats">,
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

    try {
      const text = await extractTextFromPDF(file?.fileurl as string);
      const token = await getToken({ template: "convex" });
      sendMessage(
        {
          text: message.text || "",
          files: message.files,
        },
        {
          body: {
            convexToken: token,
            contextFolder: contextFolder,
            contextNote: contextNote,
            pdfText: text,
            fileDetails: {
              fileName: file?.file.fileName,
              fileType: file?.file.fileType,
            },
          },
        }
      );
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };
  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hidden p-2">
      <ChatHistoryPopover />
      <Conversation>
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<MessageSquare className="size-12" />}
              title="Start a conversation"
              description="Type a message below to begin chatting with your pdf"
            />
          ) : (
            messages.map((message) => (
              <div key={message.id}>
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
                          <Actions>
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

                  return null;
                })}
              </div>
            ))
          )}
          {status === "submitted" && <Shimmer>Thinking...</Shimmer>}
        </ConversationContent>
      </Conversation>
      <PromptInput onSubmit={handleSubmit}>
        <PromptInputHeader>
          {/* file attachments  */}
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
          {/* popover of the tagging  */}
          {/* --- TAGGING UI --- */}
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
          {/* the file upload button goes here and other like we b search  */}
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
            {/* websearch */}
          </PromptInputTools>
          {/* send button */}
          <PromptInputSubmit disabled={!input && !status} status={status} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
};

export default Chatwithpdf;
