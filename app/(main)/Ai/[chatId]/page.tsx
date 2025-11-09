import Chat from '@/components/ai/aipage';
import { Id } from '@/convex/_generated/dataModel';
import React from 'react'

export default async function ChatPage({params}:{params:Promise<{chatId:string}>}) {
    const {chatId} = await params;
  return (
    <Chat chatId={chatId as Id<'chats'>} />
  )
}
