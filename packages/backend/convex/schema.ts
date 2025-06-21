import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";
import { CoreProviders } from "./lib/models";
import { UserSettings } from "./schema/settings";
import { Message } from "./schema/message";
import { SharedThread, Thread } from "./schema/thread";
import { UsageEvent } from "./schema/usage";
import { Project } from "./schema/folders";

export { Thread, Message, SharedThread, UsageEvent, UserSettings, Project };
// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
   users: defineTable({
      name: v.optional(v.string()),
      email: v.string(),
      image: v.optional(v.string()),
      weekStartsOnMonday: v.optional(v.boolean()),
      timezone: v.optional(v.string()),
      timeFormat: v.optional(v.number()),
      dateFormat: v.optional(v.string()),
      workspaceInitialized: v.optional(v.boolean()),
      creditsUsed: v.optional(v.number()),
   }).index("email", ["email"]),

   todos: defineTable({
      text: v.string(),
      completed: v.boolean(),
      userId: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
   }).index("userId", ["userId"]),

   documents: defineTable({
      uuid: v.string(),
      workspaceId: v.string(),
      userId: v.id("users"),
      parentUuid: v.optional(v.string()),
      title: v.string(),
      description: v.optional(v.string()),
      content: v.optional(v.string()),
      customPrompt: v.optional(v.string()),
      defaultModel: v.optional(v.string()),
      documentType: v.union(
         v.literal("folder"),
         v.literal("text/plain"),
         v.literal("video/mp4"),
         v.literal("audio/mp3"),
         v.literal("application/pdf"),
         v.literal("application/octet-stream"),
         v.literal("website")
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
      fileSize: v.optional(v.int64()),
      isPublic: v.boolean(),
   })
      .index("by_uuid", ["uuid"])
      .index("by_hierarchy", ["workspaceId", "parentUuid", "orderPosition"])
      .index("by_active", ["workspaceId", "isDeleted", "updatedAt"])
      .index("by_updatedAt", ["updatedAt"])
      .index("by_user", ["userId"])
      .index("by_parentUuid", ["parentUuid"])
      .index("by_workspace_updated", ["workspaceId", "updatedAt"])
      .index("by_workspace_deleted", ["workspaceId", "isDeleted"])
      .index("by_workspace_type", ["workspaceId", "documentType"])
      .index("by_workspace_public", ["workspaceId", "isPublic"])
      .index("by_parent_order", ["parentUuid", "orderPosition"]),

   apiKeys: defineTable({
      userId: v.id("users"),
      service: v.union(v.literal("gemini"), v.literal("groq"), v.literal("openrouter"), v.literal("deepgram")),
      name: v.string(),
      key: v.string(),
      is_default: v.optional(v.boolean()),
   }).index("by_user_and_service", ["userId", "service"]),

   chats: defineTable({
      userId: v.id("users"),
      title: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
      shareId: v.optional(v.string()),
      isShared: v.optional(v.boolean()),
      isGeneratingTitle: v.optional(v.boolean()),
      // isBranch: v.optional(v.boolean()),
      branchId: v.optional(v.id("chats")),
   })
      .index("by_user", ["userId"])
      .index("by_share_id", ["shareId"]),

   messages: defineTable({
      chatId: v.id("chats"),
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      modelId: v.optional(v.string()),
      thinking: v.optional(v.string()), // Store reasoning content separately
      thinkingDuration: v.optional(v.number()), // Store thinking duration in seconds
      isComplete: v.optional(v.boolean()), // For streaming messages
      isCancelled: v.optional(v.boolean()), // For cancelling streaming messages
      promptTokens: v.optional(v.number()),
      completionTokens: v.optional(v.number()),
      totalTokens: v.optional(v.number()),
      creditsSpent: v.optional(v.number()),
      attachments: v.optional(
         v.array(
            v.object({
               name: v.string(),
               type: v.string(),
               size: v.number(),
               url: v.string(),
            })
         )
      ),
      toolCalls: v.optional(
         v.array(
            v.object({
               toolCallId: v.string(),
               toolName: v.string(),
               args: v.any(),
               result: v.optional(v.any()),
            })
         )
      ),
      createdAt: v.number(),
   })
      .index("by_chat", ["chatId"])
      .index("by_chat_created", ["chatId", "createdAt"]),
});
