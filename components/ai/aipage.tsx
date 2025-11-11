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
  CopyIcon,
  Folder,
  GlobeIcon,
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
  const initialMessages = useQuery(api.chat.getChat, { chatId: chatId }); //fetch the messages form convex
  const addMessage = useMutation(api.chat.addmessage);
  const [contextFolder, setContexFolder] = useState<Doc<"folders"> | null>(
    null
  );
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [hasProcessedPendingMessage, setHasProcessedPendingMessage] =
    useState(false);

  const { getToken } = useAuth();
  const allfolders = useQuery(api.folders.fetchFolders);
  const pendingMessageProcessedRef = useRef(false);
  const transformedMessages =
    (initialMessages?.map((msg) => ({
      id: msg._id,
      role: msg.role as "user" | "assistant",
      parts: msg.parts || [],
      content: msg.content,
    })) as UIMessage[]) || [];

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
      })) as UIMessage[];

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
    sendMessage(
      {
        text: message.text || `Using context: ${contextFolder?.name}`,
        files: message.files,
      },
      {
        body: {
          webSearch: webSearch,
          contextFolder: contextFolder,
          convexToken: token,
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
        await handleSubmit(pendingMessage);

        // Clear the pending message from the store
        setPendingMessage(null);
        setHasProcessedPendingMessage(true);
      }
    };

    sendInitialMessage();
  }, [pendingMessage, initialMessages, setPendingMessage]);

  const filteredFolders = allfolders?.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
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
                    placeholder="Add files, folders, docs..."
                    value={search}
                    onValueChange={setSearch}
                  />
                  <PromptInputCommandList>
                    <PromptInputCommandEmpty className="p-3 text-muted-foreground text-sm">
                      {allfolders === undefined
                        ? "Loading..."
                        : "No folders found."}
                    </PromptInputCommandEmpty>

                    {/* Show "Added" section if a folder is selected */}
                    {contextFolder && (
                      <PromptInputCommandGroup heading="Added">
                        <PromptInputCommandItem
                          onSelect={() => {
                            setContexFolder(null);
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

                    {/* Show all folders */}
                    <PromptInputCommandGroup heading="Folders">
                      {filteredFolders?.map((folder) => (
                        <PromptInputCommandItem
                          key={folder._id}
                          onSelect={() => {
                            setContexFolder(folder);
                            setPopoverOpen(false);
                            setSearch("");
                          }}
                        >
                          <Folder className="text-primary" />
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {folder.name}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {folder.description || "No description"}
                            </span>
                          </div>
                        </PromptInputCommandItem>
                      ))}
                    </PromptInputCommandGroup>
                  </PromptInputCommandList>
                </PromptInputCommand>
              </PromptInputHoverCardContent>
            </PromptInputHoverCard>

            {/* Display the selected context as a simple tag */}
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
            </PromptInputTools>
            <PromptInputSubmit disabled={!input && !status} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};

export default Chat;
