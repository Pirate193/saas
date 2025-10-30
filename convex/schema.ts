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
    content:v.object({
        type:v.string(),
        blocks:v.array(v.any())
    }),
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

   //flashcard reviews
})