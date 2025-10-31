import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const uploadFile = mutation({
    args:{
         folderId:v.optional(v.id("folders")),
         fileName:v.string(),
         fileType:v.string(),
         storageId:v.id("_storage")
    },
    handler:async (ctx ,args)=>{
        const user = await ctx.auth.getUserIdentity();
        if(!user){
            throw new Error("Not authenticated");
        }
        const file = await ctx.db.insert("files",{
            userId:user.subject,
            folderId:args.folderId,
            fileName:args.fileName,
            fileType:args.fileType,
            storageId:args.storageId
        })
        return file;
    }
})

export const fetchfiles = query({
    args:{
        folderId:v.optional(v.id("folders")),
    },
    handler:async (ctx ,args)=>{
        const user = await ctx.auth.getUserIdentity();
        if(!user){
            throw new Error("Not authenticated");
        }
        const files = await ctx.db.query("files").withIndex("by_user_and_folder",(q)=>q.eq("userId",user.subject).eq("folderId",args.folderId)).collect(); ;
        return files;
    }
})

export const deleteFile = mutation({
    args:{
        fileId:v.id("files")
    },
    handler:async (ctx ,args)=>{
        const user = await ctx.auth.getUserIdentity();
        if(!user){
            throw new Error("Not authenticated");
        }
        await ctx.db.delete(args.fileId);
    }
})

export const getFile = query({
    args:{
        fileId:v.id("files")
    },
    handler:async (ctx ,args)=>{
       
        const file = await ctx.db.get(args.fileId);
        if(!file){
            throw new Error("File not found");
        }
        const fileurl = await ctx.storage.getUrl(file.storageId)
        return {
            file:file,
            fileurl:fileurl
        };
    }
})

