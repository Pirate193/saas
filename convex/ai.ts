import { google } from "@ai-sdk/google";
import { components } from "./_generated/api";
import { Agent, vStreamArgs } from "@convex-dev/agent";
import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

const agent = new Agent(components.agent,{
    name:'ai',
    languageModel:google('gemini-2.5-flash'),
    instructions:'',
    maxSteps:10,
})

export const createThread = mutation({
    args:{
    },
    handler:async (ctx ,args)=>{
        const user = await ctx.auth.getUserIdentity();
        if(!user){
            throw new Error("Not authenticated");
        }
        const threadId = await agent.createThread(ctx,{
            userId:user.subject,
            title:'New chat',
        })
        return threadId;
    }
})

export const chat = action({
    args:{
        threadId:v.string(),
        message:v.string(),
    },
    handler:async (ctx ,args)=>{
        const {thread} = await agent.continueThread(ctx,{
            threadId:args.threadId
        })
        const response = await thread.streamText(
            {
                prompt:args.message,
            },
            {
                saveStreamDeltas:{
                    chunking:'line'
                }
            }
        )
        await response.consumeStream()
    }
})

export const listmessages = query({
    args:{
        threadId:v.string(),
        paginationOpts:paginationOptsValidator,
        streamArgs:vStreamArgs
    },
    handler:async (ctx ,args)=>{
        const messages = await agent.listMessages(ctx,{
            threadId:args.threadId,
            paginationOpts:args.paginationOpts
        })
        const streams = await agent.syncStreams(ctx,{
            threadId:args.threadId,
            streamArgs:args.streamArgs
        })
        return {
            ...messages,
            streams
        }
    }
})

