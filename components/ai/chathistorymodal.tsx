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
import { ChevronsUpDown, Edit, MessageSquare, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { useAiStore } from '@/stores/aiStore';
import { useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

export function ChatHistoryPopover() {
  const chats = useQuery(api.chat.fetchChats);
  const params = useParams();
  const {setActiveChatId,activeChatId}=useAiStore()
  const chatId = params.chatId as Id<'chats'>;
  const deletechat= useMutation(api.chat.deleteChat);
  const updateChat = useMutation(api.chat.updateChat);

  // Dialog state
  const [selectedChat, setSelectedChat] = useState<Doc<'chats'> | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const currentChat = chats?.find(c => c._id === chatId);
  const otherChats = chats?.filter(c => c._id !== chatId).reverse(); // Show newest first

    const handleRenameClick = (chat: Doc<'chats'>) => {
    setSelectedChat(chat);
    setNewTitle(chat.title);
    setRenameDialogOpen(true);
  };

  const handleDeleteClick = (chat: Doc<'chats'>) => {
    setSelectedChat(chat);
    setDeleteAlertOpen(true);
  };

  const handleRenameSubmit = async () => {
    if (!selectedChat || !newTitle.trim()) return;
    try {
      await updateChat({ chatId: selectedChat._id, title: newTitle.trim() });
      toast.success('Chat renamed successfully!');
      setRenameDialogOpen(false);
      setSelectedChat(null);
      setNewTitle('');
    } catch (e) {
      toast.error('Failed to rename chat.');
      console.error(e);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedChat) return;
    try {
      await deletechat({ chatId: selectedChat._id });
      toast.success('Chat deleted.');
      setDeleteAlertOpen(false);
      setActiveChatId(null);
      setSelectedChat(null);
    } catch (e) {
      toast.error('Failed to delete chat.');
      console.error(e);
    }
  };

  return (
    <>
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
      <PopoverContent className="w-80 p-0 flex flex-col max-h-96">
        <ScrollArea className="flex-1 overflow-auto scrollbar-hidden">
          <div className="p-2">
            {otherChats && otherChats.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground px-2">
                  Recent Chats
                </p>
                {otherChats.map(chat => (
                  <div  key={chat._id}
                      className="group flex items-center justify-between w-full pr-2" >
                  <Button
                    variant="ghost"
                    className="flex-1 justify-start gap-2 font-normal truncate"
                    onClick={() => setActiveChatId(chat._id)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="truncate">{chat.title}</span>
                  </Button>
                   <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                          align="end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem
                            onSelect={() => handleRenameClick(chat)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => handleDeleteClick(chat)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
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
    
      {/* ---------- RENAME DIALOG ---------- */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
            <DialogDescription>
              Enter a new title for your chat: &quot;
              {selectedChat?.title || ''}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- DELETE ALERT ---------- */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat history.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}