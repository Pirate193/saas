import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";


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
        await deleteFolderRecursively(ctx, args.folderId,user.subject);
    }
})
/**
 * Helper function to recursively delete a folder and all its sub-contents
 * 
 */
async function deleteFolderRecursively(
  ctx: any, 
  folderId: Id<"folders">, 
  userId: string
) {
  // 1. RECURSION: Find and delete all Subfolders first
  const subfolders = await ctx.db
    .query("folders")
    .withIndex("by_parent", (q: any) => q.eq("parentId", folderId))
    .collect();

  for (const subfolder of subfolders) {
    await deleteFolderRecursively(ctx, subfolder._id, userId);
  }

  // 2. Fetch Items in this current folder
  const notes = await ctx.db
    .query("notes")
    .withIndex("by_folder", (q: any) => q.eq("folderId", folderId))
    .collect();

  const files = await ctx.db
    .query("files")
    .withIndex("by_folder", (q: any) => q.eq("folderId", folderId))
    .collect();

  const flashcards = await ctx.db
    .query("flashcards")
    .withIndex("by_folder", (q: any) => q.eq("folderId", folderId))
    .collect();

  // 3. Delete NOTES
  await Promise.all(notes.map((note: any) => ctx.db.delete(note._id)));

  // 4. Delete FILES (Safe Delete / Reference Counting)
  await Promise.all(
    files.map(async (file: any) => {
      // Check if any OTHER file record uses this same storageId
      const fileUsageCount = await ctx.db
        .query("files")
        .withIndex("by_storage_id", (q: any) => q.eq("storageId", file.storageId))
        .collect();

      // If this is the LAST reference (length is 1), delete the actual file
      if (fileUsageCount.length <= 1 && file.storageId) {
        await ctx.storage.delete(file.storageId);
      }

      // Always delete the database record
      return ctx.db.delete(file._id);
    })
  );

  // 5. Delete FLASHCARDS + REVIEWS
  // We process flashcards one by one to find their specific reviews
  await Promise.all(
    flashcards.map(async (card: any) => {
      // A. Find all reviews for this specific card
      const reviews = await ctx.db
        .query("flashcardReviews")
        .withIndex("by_flashcard", (q: any) => q.eq("flashcardId", card._id))
        .collect();
      
      // B. Delete all reviews for this card
      await Promise.all(reviews.map((r: any) => ctx.db.delete(r._id)));

      // C. Finally, delete the flashcard itself
      return ctx.db.delete(card._id);
    })
  );

  // 6. Delete FLASHCARD PROGRESS (Bulk Optimization)
  // Because you have an index `by_user_and_folder`, we can delete all progress
  // for this folder in one go, without looping through cards.
  const progressItems = await ctx.db
    .query("flashcardProgress")
    .withIndex("by_user_and_folder", (q: any) => 
      q.eq("userId", userId).eq("folderId", folderId)
    )
    .collect();

  await Promise.all(progressItems.map((p: any) => ctx.db.delete(p._id)));

  // 7. Delete the FOLDER itself
  await ctx.db.delete(folderId);
}
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

export const movefolder = mutation({
    args:{
        folderId:v.id('folders'),
        parentId:v.id('folders')
    },
    handler: async (ctx ,args)=>{
        const user = await ctx.auth.getUserIdentity();
        if(!user){
            throw new Error("Not authenticated");
        }
        const folder = await ctx.db.get(args.folderId);
        if(!folder || folder.userId !== user.subject){
            throw new Error("Folder not found or access denied.");
        }
        await ctx.db.patch(args.folderId,{
            parentId:args.parentId
        })
    }
})

export const makeroot = mutation({
    args:{
        folderId:v.id('folders')
    },
    handler: async (ctx ,args)=>{
        const user = await ctx.auth.getUserIdentity();
        if(!user){
            throw new Error("Not authenticated");
        }
        const folder = await ctx.db.get(args.folderId);
        if(!folder || folder.userId !== user.subject){
            throw new Error("Folder not found or access denied.");
        }
        await ctx.db.patch(args.folderId,{
            parentId:undefined
        })
    }
})
