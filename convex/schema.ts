import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { title } from "process";


export default defineSchema({
  folders:defineTable({
    userId: v.string(),
    name:v.string(),
    description:v.optional(v.string()),
    parentId:v.optional(v.string()),
  })
  .index("by_user",["userId"])
  .index("by_parent",["parentId"]),

  notes:defineTable({
    userId:v.string(),
    folderId:v.optional(v.id("folders")),
    title:v.string(),
    content:v.optional(v.string()),
    updatedAt:v.number(),
  })
  .index("by_user",["userId"])
  .index("by_user_and_folder",["userId","folderId"])
  .index("by_folder",["folderId"]),

  files:defineTable({
    userId:v.string(),
    folderId:v.optional(v.id("folders")),
    fileName:v.string(),
    fileType:v.string(),
    storageId:v.id("_storage")
  })
   .index("by_user",["userId"])
   .index("by_user_and_folder",["userId","folderId"])
    .index("by_folder",["folderId"]),
  
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
    easeFactor:v.number(), //determins interval growths
    intervalDays:v.number(),//days untill next review
    repetitions:v.number(), // consecutive correct answers
    nextReviewDate:v.number(), // next review
    lastReviewedAt:v.optional(v.number()), // last time reviewed
    totalReviews:v.number(), // total reviews
    correctReviews:v.number(),
   })
   .index("by_user",["userId"])
   .index("by_folder",["folderId"])
   .index("by_next_review",["nextReviewDate","userId"]),
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

   

})