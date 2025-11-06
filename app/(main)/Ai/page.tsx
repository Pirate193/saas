'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
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
} from '@/components/ai-elements/prompt-input';
import { Action, Actions } from '@/components/ai-elements/actions';
import { Fragment, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Response } from '@/components/ai-elements/response';
import { AtSignIcon, CopyIcon, Folder, GlobeIcon, RefreshCcwIcon, X } from 'lucide-react';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { Loader } from '@/components/ai-elements/loader';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { nanoid } from 'nanoid';
import { Doc } from '@/convex/_generated/dataModel';
import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@clerk/nextjs';


const suggestions: { key: string; value: string }[] = [
  { key: nanoid(), value: "Help with home work?" },
  { key: nanoid(), value: "Help me study?" },
  { key: nanoid(), value: "Create me flashcards about ?" },
  { key: nanoid(), value: "Explain a concept about ?" },
];
const AiPage = () => {
  const [input, setInput] = useState('');
  const [webSearch, setWebSearch] = useState(false);
  const { messages, sendMessage, status, regenerate,error } = useChat();
  const [contextFolder,setContexFolder]=useState<Doc<'folders'>|null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { getToken } = useAuth();
  const allfolders = useQuery(api.folders.fetchFolders)

  const handleSubmit = async(message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }
     const token = await getToken({template:'convex'});
    sendMessage(
      { 
        text: message.text || `Using context: ${contextFolder?.name}` ,
        files: message.files 
      },
      {
        body: {
          webSearch: webSearch,
          contextFolder: contextFolder,
          convexToken: token
        },
      },
    );
    setInput('');
  };
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const filteredFolders = allfolders?.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
      <div className="flex flex-col h-full overflow-y-auto scrollbar-hidden ">
        <Conversation className="h-full overflow-y-auto scrollbar-hidden ">
          <ConversationContent>
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'assistant' && message.parts.filter((part) => part.type === 'source-url').length > 0 && (
                  <Sources>
                    <SourcesTrigger
                      count={
                        message.parts.filter(
                          (part) => part.type === 'source-url',
                        ).length
                      }
                    />
                    {message.parts.filter((part) => part.type === 'source-url').map((part, i) => (
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
                  switch (part.type) {
                    case 'text':
                      return (
                        <Fragment key={`${message.id}-${i}`}>
                          <Message from={message.role}>
                            <MessageContent>
                              <Response>
                                {part.text}
                              </Response>
                            </MessageContent>
                          </Message>
                          {message.role === 'assistant' && i === messages.length - 1 && (
                            <Actions className="mt-2">
                              <Action
                                onClick={() => regenerate()}
                                label="Retry"
                              >
                                <RefreshCcwIcon className="size-3" />
                              </Action>
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
                    case 'reasoning':
                      return (
                        <Reasoning
                          key={`${message.id}-${i}`}
                          className="w-full"
                          isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            ))}
            {status === 'submitted' && <Shimmer>Thinking...</Shimmer>}
         
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
         <Suggestions>
            {suggestions.map((suggestion) => (
              <Suggestion
                key={suggestion.key}
                onClick={handleSuggestionClick}
                suggestion={suggestion.value}
              />
            ))}
          </Suggestions>
        <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
          <PromptInputHeader>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
           <PromptInputHoverCard open={popoverOpen} onOpenChange={setPopoverOpen}>
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
                      {filteredFolders?.map(folder => (
                        <PromptInputCommandItem
                          key={folder._id}
                          onSelect={() => {
                            setContexFolder(folder);
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
            
            {/* Display the selected context as a simple tag */}
            {contextFolder && !popoverOpen && (
                 <PromptInputButton size="sm" variant="outline" onClick={() => setPopoverOpen(true)}>
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
                variant={webSearch ? 'default' : 'ghost'}
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

export default AiPage;