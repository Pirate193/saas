
import { components } from "./_generated/api";
import { RAG } from "@convex-dev/rag";
import { google } from '@ai-sdk/google';
import { action } from "./_generated/server";
import { v } from "convex/values";

type FilterTypes = {
  folderId: string;
  fileId:string;
};
const rag = new RAG<FilterTypes>(components.rag, {
  textEmbeddingModel: google.textEmbeddingModel('gemini-embedding-001'),
  embeddingDimension: 768, 
  filterNames:["folderId","fileId"],
});

export const addFile = action({
    args:{
        folderId:v.id("folders"),
        fileId:v.id("files"),
        text:v.string(),
        fileName:v.string(),
    },
    handler:async (ctx ,args)=>{
        const user = await ctx.auth.getUserIdentity();
        
        await rag.add(ctx,{
            namespace:user?.subject as string,
            text:args.text,
            title:args.fileName,
            filterValues:[
                {name:'folderId',value:args.folderId},
                {name:'fileId',value:args.fileId},
            ],
            
        })
    }
})
export const search = action({
    args:{
        query:v.string(),
        folderId:v.id("folders"),
        fileId:v.id("files"),
    },
    handler:async (ctx ,args)=>{
        const user = await ctx.auth.getUserIdentity();
         const results = await rag.search(ctx,{
             namespace:user?.subject as string,
             query:args.query,
             filters:[
                {name:'folderId',value:args.folderId},
                {name:'fileId',value:args.fileId},
             ]
         })
        return results;
    }
})