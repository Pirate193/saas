"use client";

import { useAiStore } from "@/stores/aiStore";
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
  GetFolderItems,
  GetUserFlashcards,
  UpdateNote,
} from "@/components/ai/tools";
import { UIMessage } from "ai";
import { ChatHistoryPopover } from "./chathistorymodal";

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
  const [search, setSearch] = useState("");
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

  // Update the ref whenever activeChatId changes
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

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
    if (initialMessages && initialMessages.length > 0) {
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
              contextFolder:
                context && context.type === "folder" ? context : null,
              convexToken: token,
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
          contextFolder: context
            ? context.type === "folder"
              ? context
              : null
            : null,
          convexToken: token,
        },
      }
    );
  };

  return (
    <div>
      {/* backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50  z-40 animate-fadeIn"
          onClick={() => onClose()}
        />
      )}
      <div
        className={`fixed bottom-0 right-0 w-full md:w-[480px] md:bottom-8 md:right-8 bg-background md:rounded-2xl shadow-2xl z-50 transition-all duration-300 ${
          isOpen
            ? "translate-y-0 opacity-100"
            : "translate-y-full md:translate-y-[120%] opacity-0 pointer-events-none"
        }`}
        style={{ maxHeight: "100vh" }}
      >
        {/* header  */}
        <div>
          <ChatHistoryPopover />
        </div>
        {/* content  */}
        <div className="flex flex-col" style={{ height: "calc(100vh - 70px)" }}>
          <Conversation>
            <ConversationContent className="h-full overflow-y-auto scrollbar-hidden">
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
                        <Fragment key={`${message.id}-${i}`}>
                          <Message from={message.role}>
                            <MessageContent>
                              <Response>{part.text}</Response>
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
                    if (part.type === "dynamic-tool") {
                      if (part.toolName === "createNote") {
                        return (
                          <Tool key={`${message.id}-${i}`}>
                            <ToolHeader
                              state={part.state}
                              type={`tool-${part.type}`}
                              title="createNote"
                            />
                            <ToolContent>
                              {part.state === "output-available" && (
                                <CreateNote output={part.output} />
                              )}
                            </ToolContent>
                          </Tool>
                        );
                      }
                      if (part.toolName === "updateNote") {
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

                      // Generate Flashcards
                      if (part.toolName === "generateFlashcards") {
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

                      // Get Folder Items
                      if (part.toolName === "getfolderitems") {
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

                      // Get User Flashcards
                      if (part.toolName === "getUserFlashcards") {
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
                      return null;
                    }
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

              {/* Display the selected context as a simple tag */}
              {context && (
                <PromptInputButton size="sm" variant="outline">
                  <Folder size={12} />
                  <span>{context.name}</span>
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
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
