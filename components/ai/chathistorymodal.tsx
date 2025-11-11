'use client';

import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter, useParams } from 'next/navigation';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, MessageSquare, Plus } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Id } from '@/convex/_generated/dataModel';
import { useAiStore } from '@/stores/aiStore';

export function ChatHistoryPopover() {
  const chats = useQuery(api.chat.fetchChats);
  const params = useParams();
  const {setActiveChatId,activeChatId}=useAiStore()
  const chatId = params.chatId as Id<'chats'>;
  const deletechat= useMutation(api.chat.deleteChat);
  const updateChat = useMutation(api.chat.updateChat);

  const currentChat = chats?.find(c => c._id === chatId);
  const otherChats = chats?.filter(c => c._id !== chatId).reverse(); // Show newest first

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="text-lg font-bold gap-2 px-2"
        >
          <span className="truncate max-w-48">
            {currentChat ? currentChat.title : 'New Chat'}
          </span>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <ScrollArea className="max-h-96">
          <div className="p-2">
            {otherChats && otherChats.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground px-2">
                  Recent Chats
                </p>
                {otherChats.map(chat => (
                  <Button
                    key={chat._id}
                    variant="ghost"
                    className="w-full justify-start gap-2 font-normal"
                    onClick={() => setActiveChatId(chat._id)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="truncate">{chat.title}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="border-t p-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() =>setActiveChatId(null)}
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}