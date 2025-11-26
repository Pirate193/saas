import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";


export const createFlashcard = mutation({
    args:{
         folderId:v.id("folders"),
         question:v.string(),
            answers:v.array(v.object({
              text:v.string(),
              isCorrect:v.boolean()
            })),
            isMultipleChoice:v.boolean(),
        explanation:v.optional(v.string()),
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
            explanation:args.explanation,
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

export const reviewFlashcard = mutation({
    args:{
        flashcardId:v.id("flashcards"),
        quality:v.number(),
        timeSpendSeconds:v.optional(v.number()),
    },
    handler: async (ctx ,args)=>{
        const user = await ctx.auth.getUserIdentity();
        if(!user){
            throw new Error("Not authenticated");
        }
        const flashcard = await ctx.db.get(args.flashcardId);
        if(!flashcard || flashcard.userId !== user.subject){
            throw new Error("Flashcard not found or access denied.");
        }
        const existingProgress = await ctx.db.query("flashcardProgress").withIndex("by_user_flashcard",(q)=> q.eq("userId",user.subject).eq("flashcardId",args.flashcardId)).first();
        
        const quality = args.quality;
        let easeFactor = existingProgress ? existingProgress.easeFactor :2.5;
        let interval = existingProgress ? existingProgress.intervalDays: 0;
        let repetitions = existingProgress ? existingProgress.repetitions : 0;
        const totalReviews = existingProgress ? existingProgress.totalReviews : 0;
        const correctReviews = existingProgress ? existingProgress.correctReviews : 0;
        let wasCorrect = true;

        if(quality < 3){
            easeFactor = Math.max(1.3,easeFactor - 0.2);
            interval = 0;
            repetitions = 0;
            wasCorrect = false;
        }else {
            easeFactor = Math.max(1.3,easeFactor +(0.1 -(5-quality)*(0.08 + (5-quality)*0.02)));
            easeFactor = Number(easeFactor.toFixed(2));
            repetitions += 1;

            if(repetitions === 1){
                interval = 1;
            }else if(repetitions === 2){
                interval = 6;
            }else {
                interval = Math.round(interval * easeFactor);
            }
        }
        const now = Date.now();
        const nextReviewDate = new Date(now);
        nextReviewDate.setDate(nextReviewDate.getDate() + interval);
        nextReviewDate.setHours(0,0,0,0);
        
       if(existingProgress){
        await ctx.db.patch(existingProgress._id,{
            easeFactor:easeFactor,
            intervalDays:interval,
            repetitions:repetitions,
            nextReviewDate:nextReviewDate.getTime(),
            lastReviewedAt:now,
            totalReviews: totalReviews + 1,
            correctReviews:correctReviews + (wasCorrect ? 1 : 0),
        })
       }else {
        await ctx.db.insert('flashcardProgress',{
            userId:user.subject,
            flashcardId:args.flashcardId,
            folderId:flashcard.folderId,
            easeFactor:easeFactor,
            intervalDays:interval,
            repetitions:repetitions,
            nextReviewDate:nextReviewDate.getTime(),
            lastReviewedAt:now,
            totalReviews: totalReviews + 1,
            correctReviews:correctReviews + (wasCorrect ? 1 : 0),
        })
       }
        await ctx.db.insert("flashcardReviews",{
            userId:user.subject,
            flashcardId:args.flashcardId,
            folderId:flashcard.folderId,
            quality:quality,
            timeSpendSeconds:args.timeSpendSeconds,
            wasCorrect:wasCorrect,
            easeFactorAfter:easeFactor,
            intervalDaysAfter:interval,
            reviewedAt:now,
        })
        return{
            easeFactor,
            intervalDays:interval,
            repetitions,
            nextReviewDate:nextReviewDate.getTime()
        }

    }
})

export const fetchflashcarddue = query({
    args:{
        folderId:v.id("folders"),
        limit:v.optional(v.number())
    },
    handler: async(ctx ,args)=>{
     const user = await ctx.auth.getUserIdentity();
     const limit = args.limit || 50;
     if(!user){
        throw new Error("Not authenticated");
     }

     const cards = await ctx.db.query('flashcards').withIndex('by_folder',(q)=>q.eq("folderId",args.folderId)).collect();

     const progressList = await ctx.db.query('flashcardProgress').withIndex('by_user_and_folder',(q)=>q.eq("userId",user?.subject).eq("folderId",args.folderId)).collect();
     
    const progressMap = new Map()
    progressList.forEach((p)=>progressMap.set(p.flashcardId,p));
    const now = Date.now();
    const dueCards = [];
    for(const card of cards){
        const progress = progressMap.get(card._id);

        if(!progress){
            dueCards.push({
                ...card,
                status:"new",
                reps:0,
                interval:0,
                ease:2.5,
            })
        }else if (progress.nextReviewDate <= now){
          dueCards.push({
            ...card,
            status:"due",
            reps:progress.repetitions,
            interval:progress.intervalDays,
            ease:progress.easeFactor,

          })
        }
    }
    return dueCards.slice(0,limit);

    }
})

export const fetchStudyStats = query({
    args:{
        folderId:v.id("folders"),
    },
    handler: async (ctx ,args)=>{
        const user = await ctx.auth.getUserIdentity();
        if(!user){
            throw new Error("Not authenticated");
        }
        
        const flashcards = await ctx.db.query('flashcardProgress').withIndex("by_user_and_folder",(q)=>q.eq("userId",user.subject).eq("folderId",args.folderId)).collect()

        
        
        const now = new Date();
        const weekFromnow = new Date();
        weekFromnow.setDate(weekFromnow.getDate()+7);

        const  totalCards = flashcards.length;
        const dueToday = flashcards.filter(f=> new Date(f.nextReviewDate)<= now).length;
        const duethisweek = flashcards.filter(f=> new Date(f.nextReviewDate)<= weekFromnow).length;
        const masteredCards = flashcards.filter(f=>f.repetitions >= 3 && f.easeFactor >= 2.5).length;
        const newcards = flashcards.filter(f=>f.totalReviews === 0).length;
        const averageEase = flashcards.reduce((sum,f)=>sum + (f.easeFactor || 2.5),0)/flashcards.length;
        const totalReviews = flashcards.reduce((sum,f)=>sum + (f.totalReviews || 0),0);
        const successRate = flashcards.reduce((sum,f)=>sum + (f.totalReviews || 0),0)>0
        ? (flashcards.reduce((sum,f)=>sum + (f.correctReviews||0 ),0))/ flashcards.reduce((sum,f)=>sum + (f.totalReviews || 0),0)*100
        :0;
        return {
            totalCards,
            dueToday,
            duethisweek,
            masteredCards,
            newcards,
            averageEase,
            totalReviews,
            successRate,
        }
    }
})

export const fetchFlashcardProgress = query({
    args:{
        flashcardId:v.id("flashcards"),
    },
    handler: async (ctx ,args)=>{
        const user = await ctx.auth.getUserIdentity();
        if(!user){
            throw new Error("Not authenticated");
        }
        const progress = await ctx.db.query('flashcardProgress').withIndex("by_user_flashcard",(q)=>q.eq("userId",user.subject).eq("flashcardId",args.flashcardId)).first();
        return progress;
    }
})


export const saveAiFlashcards = mutation({
  args: {
    folderId: v.id("folders"),
    flashcards: v.array(
      v.object({
        question: v.string(),
        answers: v.array(
          v.object({ text: v.string(), isCorrect: v.boolean() })
        ),
        explanation: v.string(),
      })
    ),
    isMultipleChoice: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Unauthorized");
    const count = args.flashcards.length;
    // 1. Final Limit Check (Security)
    // We check "canGenerate" again to prevent someone manually calling this mutation to bypass limits
    const canGen = await ctx.runQuery(api.subscriptions.canGenerateFlashcard,{count:count});
    if (!canGen.allowed) {
      throw new Error(canGen.reason || "Limit reached");
    }

    // 2. Batch Insert Flashcards
    const promises = args.flashcards.map((card) =>
      ctx.db.insert("flashcards", {
        userId: user.subject,
        folderId: args.folderId,
        question: card.question,
        answers: card.answers,
        isMultipleChoice: args.isMultipleChoice,
        explanation: card.explanation, // Store the AI explanation!
        updatedAt: Date.now(),
      })
    );

    await Promise.all(promises);

   await ctx.runMutation(api.subscriptions.trackFlashcardGeneration,{count:count})
  },
});