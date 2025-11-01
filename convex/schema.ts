import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";


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
   })
   .index("by_user",["userId"])
   .index("by_folder",["folderId"]),

   //flashcard reviews
})