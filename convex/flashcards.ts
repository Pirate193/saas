import { v } from "convex/values";
import { mutation, query } from "./_generated/server";


export const createFlashcard = mutation({
    args:{
         folderId:v.id("folders"),
         question:v.string(),
            answers:v.array(v.object({
              text:v.string(),
              isCorrect:v.boolean()
            })),
            isMultipleChoice:v.boolean(),
    },
    handler:async(ctx ,args)=>{
        const identity = await ctx.auth.getUserIdentity();
        if(!identity){
            throw new Error("Not authenticated");
        }
        const flashcardId = await ctx.db.insert("flashcards",{
            userId:identity.subject,
            folderId:args.folderId,
            question:args.question,
            answers:args.answers,
            isMultipleChoice:args.isMultipleChoice,
            updatedAt:Date.now(),
        })
        return flashcardId
    }
})

export const deleteFlashcard = mutation({
    args:{
        flashcardId:v.id("flashcards")
    },
    handler:async (ctx ,args)=>{
        const user = await ctx.auth.getUserIdentity();
        if(!user){
            throw new Error("Not authenticated");
        }
        const flashcard = await ctx.db.get(args.flashcardId);
        if(!flashcard || flashcard.userId !== user.subject){
            throw new Error("Flashcard not found or access denied.");
        }
        await ctx.db.delete(args.flashcardId);
    }
})

export const updateFlashcard = mutation({
    args:{
        flashcardId:v.id("flashcards"),
        question:v.optional(v.string()),
        answers:v.optional(v.array(v.object({
            text:v.string(),
            isCorrect:v.boolean()
        }))),
        isMultipleChoice:v.optional(v.boolean()),
    },
    handler:async (ctx ,args)=>{
        const user = await ctx.auth.getUserIdentity();
        if(!user){
            throw new Error("Not authenticated");
        }
        const flashcard = await ctx.db.get(args.flashcardId);
        if(!flashcard || flashcard.userId !== user.subject){
            throw new Error("Flashcard not found or access denied.");
        }
        await ctx.db.patch(args.flashcardId, {
            question:args.question,
            answers:args.answers,
            isMultipleChoice:args.isMultipleChoice,
            updatedAt:Date.now(),
        })
    }
})

export const getFlashcard = query({
    args:{
        flashcardId:v.id("flashcards")
    },
    handler:async(ctx ,args)=>{
        const user = await ctx.auth.getUserIdentity();
        if(!user){
            throw new Error("Not authenticated");
        }
        const flashcard = await ctx.db.get(args.flashcardId);
        if(!flashcard || flashcard.userId !== user.subject){
            throw new Error("Flashcard not found or access denied.");
        }
        return flashcard
    }
})

export const fetchFlashcards = query({
    args:{
        folderId:v.id("folders")
    },
    handler:async(ctx ,args)=>{
        const user = await ctx.auth.getUserIdentity();
        if(!user){
            throw new Error("Not authenticated");
        }
        const flashcards = await ctx.db.query("flashcards").withIndex("by_folder",(q)=>q.eq("folderId",args.folderId)).collect();
        return flashcards
    }
})