// documents.ts
// Convex schema for the 'documents' table. Defines the shape and validation for document records.
import { v } from "convex/values";

export const Documents = v.object({
   workspaceId: v.id("workspaces"),
   userId: v.id("users"),
   parentId: v.optional(v.id("documents")),
   title: v.string(),
   description: v.optional(v.string()),
   content: v.optional(v.string()),
   customPrompt: v.optional(v.string()),
   defaultModel: v.optional(v.string()),
   documentType: v.union(
      v.literal("folder"),
      v.literal("text/plain"),
      // v.literal("video/mp4"),
      // v.literal("audio/mp3"),
      v.literal("application/pdf")
      // v.literal("application/octet-stream"),
      // v.literal("website")
   ),
   writingStyle: v.optional(
      v.union(
         v.literal("academic"),
         v.literal("business"),
         v.literal("casual"),
         v.literal("creative"),
         v.literal("formal"),
         v.literal("technical")
      )
   ),
   orderPosition: v.number(),
   depth: v.number(),
   updatedAt: v.number(),
   lastViewedAt: v.optional(v.number()),
   isDeleted: v.boolean(),
   metadata: v.optional(v.any()),
   fileUrl: v.optional(v.string()),
   fileSize: v.optional(v.int64()),
   isPublic: v.boolean(),
   isLocked: v.boolean(),
   isCollapsed: v.optional(v.boolean()),
});
