import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";


export const createFolder = mutation({
    args:{
        name:v.string(),
        description:v.optional(v.string()),
        parentId:v.optional(v.string()),
    },
    handler:async (ctx ,args)=>{
        const user = await ctx.auth.getUserIdentity();
        if(!user){
            throw new Error("Not authenticated");
        }
        const folderId = await ctx.db.insert("folders",{
            userId:user.subject,
            name:args.name,
            description:args.description,
            parentId:args.parentId,
            isPublic:false,
            viewCount:0,
            cloneCount:0,
            savedCount:0
        })
        return folderId;
    }
})

export const fetchFolders = query({
    args:{},
    handler:async (ctx ,args)=>{
        const user = await ctx.auth.getUserIdentity();
        if(!user){
            throw new Error("Not authenticated");
        }
        const folders = await ctx.db.query("folders").withIndex("by_user",(q)=>q.eq("userId",user.subject)).collect();
        return folders;
    }
})

export const updateFolder = mutation({
    args:{
        folderId:v.id("folders"),
        name:v.optional(v.string()),
        description:v.optional(v.string()),
    },
    handler:async (ctx ,args)=>{
        const user = await ctx.auth.getUserIdentity();
        if(!user){
            throw new Error("Not authenticated");
        }
        const folder = await ctx.db.get(args.folderId);
        if(!folder || folder.userId !== user.subject){
            throw new Error("Folder not found or access denied.");
        }
        await ctx.db.patch(args.folderId,{
            name:args.name,
            description:args.description,
        })
    }
})

export const deleteFolder = mutation({
    args:{
        folderId:v.id("folders"),
    },
    handler:async (ctx ,args)=>{
        const user = await ctx.auth.getUserIdentity();
        if(!user){
            throw new Error("Not authenticated");
        }
        const folder = await ctx.db.get(args.folderId);
        if(!folder || folder.userId !== user.subject){
            throw new Error("Folder not found or access denied.");
        }
        await ctx.db.delete(args.folderId);
    }
})

export const getFolderById = query({
    args:{
        folderId:v.id("folders"),
    },
    handler:async (ctx ,args)=>{
        const user = await ctx.auth.getUserIdentity();
        if(!user){
            throw new Error("Not authenticated");
        }
        const folder = await ctx.db.get(args.folderId);
        if(!folder || folder.userId !== user.subject){
            throw new Error("Folder not found or access denied.");
        }
        return folder;
    }
})

export const addbanner = mutation({
    args:{
        storageId:v.id("_storage"),
        folderId:v.id('folders')
    },
    handler:async (ctx ,args)=>{
        const user = await ctx.auth.getUserIdentity();
        if(!user){
            throw new Error("Not authenticated");
        }
        const folder = await ctx.db.get(args.folderId);
        if(!folder || folder.userId !== user.subject){
            throw new Error("Folder not found or access denied.");
        }
        await ctx.db.patch(args.folderId,{
            bannerId:args.storageId
        })
    }
})

//getting any url 
export const getUrl = query({
    args:{
        storageId:v.id("_storage")
    },
    handler:async (ctx ,args)=>{
        const url = await ctx.storage.getUrl(args.storageId)
        return url;
    }
})

export const removebanner = mutation({
  args: {
    folderId: v.id("folders"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Not authenticated");

    const folder = await ctx.db.get(args.folderId);
    if (!folder || folder.userId !== user.subject) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.folderId, {
      bannerId: undefined,
    });
  },
});
