import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { title } from "process";


export default defineSchema({
  folders:defineTable({
    userId: v.string(),
    name:v.string(),
    description:v.optional(v.string()),
    bannerId:v.optional(v.id("_storage")),
    parentId:v.optional(v.string()),
    isPublic:v.optional(v.boolean()),
    tags:v.optional(v.array(v.string())),
    cloneCount:v.optional(v.number()),
    viewCount:v.optional(v.number()),
    savedCount:v.optional(v.number()),
    templateId:v.optional(v.id("folders")),
  })
  .index("by_user",["userId"])
  .index("by_parent",["parentId"])
  .index("by_public",['isPublic'])
  .searchIndex("search_folder",{
    searchField:'name',
    filterFields:['isPublic']
  }),

  savedFolders:defineTable({
    userId:v.string(),
    folderId:v.id('folders')
  })
  .index("by_user",["userId"])
  .index("by_folder",["folderId"]),

  folderShares:defineTable({
    folderId:v.id('folders'),
    ownerId:v.string(),
    sharedWithEmail:v.string(),
    role:v.union(v.literal("editor"),v.literal("viewer"))
  })
  .index("by_folder",["folderId"])
  .index('by_email',['sharedWithEmail']),

  notes:defineTable({
    userId:v.string(),
    folderId:v.optional(v.id("folders")),
    title:v.string(),
    content:v.optional(v.string()),
    updatedAt:v.number(),
    templateId:v.optional(v.id('notes')),
  })
  .index("by_user",["userId"])
  .index("by_user_and_folder",["userId","folderId"])
  .index("by_folder",["folderId"]),

  files:defineTable({
    userId:v.string(),
    folderId:v.optional(v.id("folders")),
    fileName:v.string(),
    fileType:v.string(),
    storageId:v.id("_storage"),
    templateId:v.optional(v.id('files')),
  })
   .index("by_user",["userId"])
   .index("by_user_and_folder",["userId","folderId"])
    .index("by_folder",["folderId"])
    .index("by_storage_id", ["storageId"]),
  
   // flashceards
   flashcards:defineTable({
    userId:v.string(),
    folderId:v.id("folders"),
    question:v.string(),
    answers:v.array(v.object({
      text:v.string(),
      isCorrect:v.boolean()
    })),
    isMultipleChoice:v.boolean(),
    updatedAt:v.number(),
    explanation:v.optional(v.string()),
    templateId:v.optional(v.id('flashcards')),
   }) 
   .index("by_folder",["folderId"]),

   flashcardProgress:defineTable({
    userId:v.string(),
    folderId:v.id("folders"),
    flashcardId:v.id("flashcards"),
    easeFactor:v.number(), //determins interval growths
    intervalDays:v.number(),//days untill next review
    repetitions:v.number(), // consecutive correct answers
    nextReviewDate:v.number(), // next review
    lastReviewedAt:v.optional(v.number()), // last time reviewed
    totalReviews:v.number(), // total reviews
    correctReviews:v.number(),
   })
   .index("by_user_and_folder",["userId","folderId"])
   .index("by_user_flashcard",["userId","flashcardId"]),
   //flashcard reviews
   flashcardReviews:defineTable({
    userId:v.string(),
    flashcardId:v.id("flashcards"),
    folderId:v.id("folders"),
    quality:v.number(), // 0-5rating
    wasCorrect:v.boolean(),
    timeSpendSeconds:v.optional(v.number()),
    easeFactorAfter:v.number(),
    intervalDaysAfter:v.number(),
    reviewedAt:v.number(),
   })
   .index("by_user",["userId"])
   .index("by_flashcard",["flashcardId"]),

   //chat table
   chats:defineTable({
    userId:v.string(),
    title:v.string()
   })
   .index("by_user",["userId"])
   .index("by_title",["title"]),
   
   //messages table
   messages:defineTable({
    chatId:v.id("chats"),
    userId:v.string(),
    role:v.string(),
    content:v.string(),
    parts:v.any()
   })
   .index("by_chat",["chatId"]),

   // Subscriptions table
   subscriptions:defineTable({
     userId:v.string(),
     tier:v.union(v.literal("free"),v.literal("pro")),
     polarSubscriptionId:v.optional(v.string()),
     polarCustomerId:v.optional(v.string()),
     polarProductId:v.optional(v.string()),
     status:v.optional(v.string()), // active, canceled, past_due, etc.
     currentPeriodEnd:v.optional(v.number()),
     updatedAt:v.number(),
   })
   .index("by_user",["userId"])
   .index("by_polar_subscription",["polarSubscriptionId"]),

   // Usage tracking table
   usageTracking:defineTable({
     userId:v.string(),
     // Daily limits (reset at midnight UTC)
     dailyAiTokens:v.number(), // tokens used today
     dailyFlashcardsGenerated:v.number(), // flashcards created today
     lastResetDate:v.string(), // date in YYYY-MM-DD format for daily reset
     // Total limits
     totalFilesUploaded:v.number(), // total PDF uploads
     updatedAt:v.number(),
   })
   .index("by_user",["userId"]),

   videos:defineTable({
    userId:v.string(),
    folderId:v.optional(v.id("folders")),
    title:v.optional(v.string()),
    description:v.optional(v.string()),
    url:v.optional(v.string()),
    templateId:v.optional(v.id("videos")),
    filesize:v.optional(v.number()),
    thumbnail:v.optional(v.string()),
    status:v.union(v.literal("generating"),v.literal("ready"),v.literal("failed")),
   })
   .index("by_user",["userId"])
   .index("by_folder",["folderId"])
   .index("by_title",["title"]),

})
