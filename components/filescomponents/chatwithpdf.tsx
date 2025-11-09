'use client';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel'
import { useChat } from '@ai-sdk/react';
import { useAction, useMutation, useQuery } from 'convex/react';
import React, { Fragment, useEffect, useRef, useState } from 'react'
import { PromptInput, PromptInputActionAddAttachments, PromptInputActionMenu, PromptInputActionMenuContent, PromptInputActionMenuTrigger, PromptInputAttachment, PromptInputAttachments, PromptInputBody, PromptInputFooter, PromptInputHeader, PromptInputMessage, PromptInputSubmit, PromptInputTextarea, PromptInputTools } from '../ai-elements/prompt-input';
import { Conversation, ConversationContent } from '../ai-elements/conversation';
import { Message, MessageContent } from '../ai-elements/message';
import { Response } from '../ai-elements/response';
import { Action, Actions } from '../ai-elements/actions';
import { CopyIcon, RefreshCcwIcon } from 'lucide-react';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '../ai-elements/reasoning';
import { Shimmer } from '../ai-elements/shimmer';
import { useAuth } from '@clerk/nextjs';
import extractTextFromPDF from '@/lib/pdfparse';
import { useThreadMessages, useUIMessages } from "@convex-dev/agent/react";
import { toUIMessages, type UIMessage } from "@convex-dev/agent";
import { set } from 'date-fns';
import { title } from 'process';
import { error } from 'console';
import { toast } from 'sonner';
interface ChatwithpdfProps {
    fileId:Id<'files'>;
}
const Chatwithpdf = ({fileId}:ChatwithpdfProps) => {
    const file = useQuery(api.files.getFile,{fileId:fileId});
    const [input,setInput]=useState('');
    const folder = useQuery(api.folders.getFolderById,{
        folderId:file?.file.folderId as Id<'folders'>});
    // const {messages,sendMessage,status,regenerate,error}=useChat({
    // });
    const [threadId,setThreadId]=useState<string>('');
    const [loading,setLoading]=useState(false);
    const hasCreatedThread = useRef(false);
    const chat = useAction(api.ai.chat);
     const createThread = useMutation(api.ai.createThread)
    const {results,status}=useThreadMessages(api.ai.listmessages,
       threadId ? { threadId } :'skip',
      {initialNumItems:10, stream:true}
    )
    const uimessages = toUIMessages(results)
     const { getToken } = useAuth();
       useEffect(()=>{
      if(!threadId && !hasCreatedThread.current){
        hasCreatedThread.current = true;
        createThread().then((result)=>{
          setThreadId(result.threadId);
        }).catch((error)=>{
          console.error('Error creating thread:',error);
          hasCreatedThread.current = false;
        })
      }
    },[threadId,createThread])

    const handleSubmit =async(message:PromptInputMessage)=>{
      setLoading(true);
          setInput('');
      const hasText = Boolean(message.text);
      const hasAttachments = Boolean(message.files?.length);
      if(!(hasText || hasAttachments)){
        return;
      }
      if(!threadId){
        return;
      }
 try{
      const text = await extractTextFromPDF(file?.fileurl as string);
      const token = await getToken({template:'convex'});
      const prompt =`
      You are an AI Tutor. A student is reviewing a file.
      The file is ${file?.file.fileName} in folder ${folder?.name} filetype is ${file?.file.fileType}.
      The file text is ${text} the student is asking ${message.text}`

      await chat({
        threadId:threadId,
        message:prompt
      })

      // sendMessage(
      //   {
      //     text:prompt,
      //     files:message.files
      //   },{
      //     body:{
      //       webSearch:false,
      //       contextFolder:folder,
      //       convexToken:token
      //     }
      //   }
      // )
    }catch(error){
      console.error('Error sending message:',error);
      toast.error('Failed to send message');
    }finally{
     setLoading(false);
    }
      
  
    }
  return (
    <div className='flex flex-col h-full overflow-y-auto scrollbar-hidden' >
      <Conversation>
        <ConversationContent>
          {uimessages.map((message)=>(
            <div key={message.id} >
            {message.parts.map((part,i)=>{
              if(part.type === 'text'){
                return (
                  <Fragment key={`${message.id}-${i}`}  >
                    <Message from={message.role} >
                        <MessageContent>
                          <Response>
                            {part.text}
                          </Response>
                        </MessageContent>
                    </Message>
                    {message.role === 'assistant' && (
                      <Actions>
                        <Action
                        // onClick={()=>regenerate()}
                        >
                          <RefreshCcwIcon className='size-3' />
                        </Action>
                        <Action
                        onClick={()=>navigator.clipboard.writeText(part.text)}
                        >
                          <CopyIcon className='size-3' />
                        </Action>
                      </Actions>
                    ) }
                  </Fragment>
                )
              }
              if(part.type === 'reasoning'){
                return (
                  <Reasoning
                   key={`${message.id}-${i}`}
                    className="w-full"
                          isStreaming={message.status === 'streaming' && i === message.parts.length - 1 && message.id === uimessages[uimessages.length - 1].id}
                   >
                    <ReasoningTrigger />
                    <ReasoningContent>
                      {part.text}
                    </ReasoningContent>
                  </Reasoning>
                )
              }
            })}
            </div>
          ))}
          {loading&& <Shimmer>Thinking...</Shimmer>}
        </ConversationContent>
      </Conversation>
      <PromptInput onSubmit={handleSubmit} >
        <PromptInputHeader>
          {/* file attachments  */}
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
        </PromptInputHeader>
        <PromptInputBody>
          <PromptInputTextarea 
          onChange={(e)=>setInput(e.target.value)}
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
          <PromptInputSubmit disabled={!input && loading} />
        </PromptInputFooter>
      </PromptInput>

    </div>
  )
} 

export default Chatwithpdf