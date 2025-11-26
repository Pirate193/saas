import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { polar } from "./polar";

// Free tier limits
const LIMITS = {
  FREE_DAILY_TOKENS: 1000, // 10k tokens per day
  FREE_TOTAL_FILE_UPLOADS: 5, // 5 PDF uploads total
  FREE_DAILY_FLASHCARDS: 10, // 10 AI-generated flashcards per day
};

// Get or create user subscription
export const CreateSubscription = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Not authenticated");
    }

    let subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user.subject))
      .first();

    if (!subscription) {
      // Create default free subscription
      const now = Date.now();
      const subscriptionId = await ctx.db.insert("subscriptions", {
        userId: user.subject,
        tier: "free",
        updatedAt: now,
      });
      subscription = await ctx.db.get(subscriptionId);
    }

    return subscription;
  },
});

export const getSubscription = query({
  args:{},
  handler:async (ctx)=>{
    const user = await ctx.auth.getUserIdentity();
    if(!user){
      throw new Error('not authenticated')
    }
    const subscription = await polar.getCurrentSubscription(ctx,{userId:user.subject});

    return {
      ...subscription,
      isFree:!subscription,
      isPro:subscription?.productKey === 'Folders_Pro'
    }

  }
})

// Get or create usage tracking
export const getOrCreateUsageTracking = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Not authenticated");
    }

    let usage = await ctx.db
      .query("usageTracking")
      .withIndex("by_user", (q) => q.eq("userId", user.subject))
      .first();

    if (!usage) {
      // Create default usage tracking
      const now = Date.now();
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const usageId = await ctx.db.insert("usageTracking", {
        userId: user.subject,
        dailyAiTokens: 0,
        dailyFlashcardsGenerated: 0,
        lastResetDate: today,
        totalFilesUploaded: 0,
        updatedAt: now,
      });
      usage = await ctx.db.get(usageId);
    }

    // Reset daily limits if it's a new day
    const today = new Date().toISOString().split("T")[0];
    if (usage && usage.lastResetDate !== today) {
      await ctx.db.patch(usage._id, {
        dailyAiTokens: 0,
        dailyFlashcardsGenerated: 0,
        lastResetDate: today,
        updatedAt: Date.now(),
      });
      usage = await ctx.db.get(usage._id);
    }

    return usage;
  },
});

// // Get subscription status with usage stats
// export const getSubscriptionStatus = query({
//   args: {},
//   handler: async (ctx) => {
//     const user = await ctx.auth.getUserIdentity();
//     if (!user) {
//       throw new Error("Not authenticated");
//     }

//     // Get or create subscription
//     let subscription = await ctx.runQuery(api.subscriptions.getOrCreateSubscription);
    
//     // Get or create usage
//     let usage = await ctx.runQuery(api.subscriptions.getOrCreateUsageTracking);

//     const isPro = subscription?.tier === "pro";

//     return {
//       subscription,
//       usage,
//       isPro,
//       limits: {
//         dailyTokens: isPro ? Infinity : LIMITS.FREE_DAILY_TOKENS,
//         totalFileUploads: isPro ? Infinity : LIMITS.FREE_TOTAL_FILE_UPLOADS,
//         dailyFlashcards: isPro ? Infinity : LIMITS.FREE_DAILY_FLASHCARDS,
//       },
//       remaining: {
//         tokensToday: isPro
//           ? Infinity
//           : Math.max(0, LIMITS.FREE_DAILY_TOKENS - (usage?.dailyAiTokens || 0)),
//         fileUploads: isPro
//           ? Infinity
//           : Math.max(0, LIMITS.FREE_TOTAL_FILE_UPLOADS - (usage?.totalFilesUploaded || 0)),
//         flashcardsToday: isPro
//           ? Infinity
//           : Math.max(0, LIMITS.FREE_DAILY_FLASHCARDS - (usage?.dailyFlashcardsGenerated || 0)),
//       },
//     };
//   },
// });

// // Check if user can perform AI chat
export const canUseAiChat = query({
  args: { },
  handler:async (ctx, args) => {
    
    const user = await ctx.auth.getUserIdentity();
    if(!user){
      throw new Error("Not authenticated");
    } 
    const subscription = await ctx.runQuery(api.subscriptions.getSubscription);
    if(subscription.isPro){
      return {
        allowed:true,
        reason:null
      }
    }
    const remaining = await ctx.db.query('usageTracking').withIndex('by_user',(q)=>q.eq('userId',user.subject)).first();
    const aiTokens = remaining?.dailyAiTokens || 0;
    if(subscription.isFree && aiTokens >= LIMITS.FREE_DAILY_TOKENS){
      return {
        allowed:false,
        reason:"free_limit_reached",
        aiTokens:aiTokens,
        aiTokensLimit:LIMITS.FREE_DAILY_TOKENS,
        lastrest:remaining?.lastResetDate,
      }
    }
    return {
      allowed:true,
      reason:null
    }   
  },
});

 // Check if user can upload files
export const canUploadFile = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if(!user){
      throw new Error("Not authenticated");
    } 
    const status = await ctx.runQuery(api.subscriptions.getSubscription);
    if(status.isPro){
      return {
        allowed:true,
        reason:null
      }
    }
    const remaining = await ctx.db.query('usageTracking').withIndex('by_user',(q)=>q.eq('userId',user.subject)).first();
    const filesUploaded = remaining?.totalFilesUploaded || 0;
    if(status.isFree && filesUploaded >= LIMITS.FREE_TOTAL_FILE_UPLOADS){
      return {
        allowed:false,
        reason:"free_limit_reached",
        filesUploaded:filesUploaded,
        filesLimit:LIMITS.FREE_TOTAL_FILE_UPLOADS
      }
    }
    return {
      allowed:true,
      reason:null
    }   
  },
});

// // Check if user can generate flashcards
export const canGenerateFlashcard = query({
  args: {},
  handler:async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if(!user){
      throw new Error("Not authenticated");
    } 
    const subscription = await ctx.runQuery(api.subscriptions.getSubscription);
    if(subscription.isPro){
      return {
        allowed:true,
        reason:null
      }
    }
    const remaining = await ctx.db.query('usageTracking').withIndex('by_user',(q)=>q.eq('userId',user.subject)).first();
    const flashcardsGenerated = remaining?.dailyFlashcardsGenerated || 0;
    if(subscription.isFree && flashcardsGenerated >= LIMITS.FREE_DAILY_FLASHCARDS){
      return {
        allowed:false,
        reason:"free_limit_reached",
        flashcardsGenerated:flashcardsGenerated,
        flashcardsLimit:LIMITS.FREE_DAILY_FLASHCARDS
      }
    }
    return {
      allowed:true,
      reason:null
    }   
  },
});

// Check if user can use chat with PDF
export const canUseChatWithPDF = query({
  args: {},
  handler: async (ctx) => { 
    const subscription = await ctx.runQuery(api.subscriptions.getSubscription);
    if(subscription.isPro){
      return {
        allowed:true,
        reason:null
      }
    }

    return {
      allowed: false,
      reason: "pro_only_feature",
    };
  },
});

// Track AI token usage
export const trackAiTokenUsage = mutation({
  args: { tokens: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Not authenticated");
    }

    let usage = await ctx.db
      .query("usageTracking")
      .withIndex("by_user", (q) => q.eq("userId", user.subject))
      .first();

    if (!usage) {
      // Create if doesn't exist
      const now = Date.now();
      const today = new Date().toISOString().split("T")[0];
      await ctx.db.insert("usageTracking", {
        userId: user.subject,
        dailyAiTokens: args.tokens,
        dailyFlashcardsGenerated: 0,
        lastResetDate: today,
        totalFilesUploaded: 0,
        updatedAt: now,
      });
      return;
    }

    // Check if we need to reset daily limits
    const today = new Date().toISOString().split("T")[0];
    if (usage.lastResetDate !== today) {
      await ctx.db.patch(usage._id, {
        dailyAiTokens: args.tokens,
        dailyFlashcardsGenerated: 0,
        lastResetDate: today,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(usage._id, {
        dailyAiTokens: usage.dailyAiTokens + args.tokens,
        updatedAt: Date.now(),
      });
    }
  },
});

// Track file upload
export const trackFileUpload = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Not authenticated");
    }

    let usage = await ctx.db
      .query("usageTracking")
      .withIndex("by_user", (q) => q.eq("userId", user.subject))
      .first();

    if (!usage) {
      const now = Date.now();
      const today = new Date().toISOString().split("T")[0];
      await ctx.db.insert("usageTracking", {
        userId: user.subject,
        dailyAiTokens: 0,
        dailyFlashcardsGenerated: 0,
        lastResetDate: today,
        totalFilesUploaded: 1,
        updatedAt: now,
      });
      return;
    }

    await ctx.db.patch(usage._id, {
      totalFilesUploaded: usage.totalFilesUploaded + 1,
      updatedAt: Date.now(),
    });
  },
});

// Track flashcard generation
export const trackFlashcardGeneration = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Not authenticated");
    }

    let usage = await ctx.db
      .query("usageTracking")
      .withIndex("by_user", (q) => q.eq("userId", user.subject))
      .first();

    if (!usage) {
      const now = Date.now();
      const today = new Date().toISOString().split("T")[0];
      await ctx.db.insert("usageTracking", {
        userId: user.subject,
        dailyAiTokens: 0,
        dailyFlashcardsGenerated: 1,
        lastResetDate: today,
        totalFilesUploaded: 0,
        updatedAt: now,
      });
      return;
    }

    // Check if we need to reset daily limits
    const today = new Date().toISOString().split("T")[0];
    if (usage.lastResetDate !== today) {
      await ctx.db.patch(usage._id, {
        dailyAiTokens: 0,
        dailyFlashcardsGenerated: 1,
        lastResetDate: today,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(usage._id, {
        dailyFlashcardsGenerated: usage.dailyFlashcardsGenerated + 1,
        updatedAt: Date.now(),
      });
    }
  },
});

// Helper to update subscription from Polar webhook
export const updateSubscription = internalMutation({
  args: {
    userId: v.string(),
    polarSubscriptionId: v.string(),
    polarCustomerId: v.string(),
    polarProductId: v.string(),
    status: v.string(),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const isPro = args.status === "active" || args.status === "trialing";
    const tier = isPro ? "pro" : "free";

    if (subscription) {
      await ctx.db.patch(subscription._id, {
        tier,
        polarSubscriptionId: args.polarSubscriptionId,
        polarCustomerId: args.polarCustomerId,
        polarProductId: args.polarProductId,
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
        updatedAt: Date.now(),
      });
    } else {
      const now = Date.now();
      await ctx.db.insert("subscriptions", {
        userId: args.userId,
        tier,
        polarSubscriptionId: args.polarSubscriptionId,
        polarCustomerId: args.polarCustomerId,
        polarProductId: args.polarProductId,
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
        updatedAt: now,
      });
    }
  },
});
