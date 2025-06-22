import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";
import { CoreProviders } from "./lib/models";
import { UserSettings } from "./schema/settings";
import { Message } from "./schema/message";
import { SharedThread, Thread } from "./schema/thread";
import { UsageEvent } from "./schema/usage";
import { Project } from "./schema/folders";
import { ResumableStream } from "./schema/streams";

export { Thread, Message, SharedThread, UsageEvent, UserSettings, Project, ResumableStream };
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

   threads: defineTable(Thread)
      .index("byAuthor", ["authorId"])
      .index("byProject", ["projectId"])
      .index("byAuthorAndProject", ["authorId", "projectId"])
      .searchIndex("search_title", {
         searchField: "title",
         filterFields: ["authorId"],
      }),

   messages: defineTable(Message).index("byThreadId", ["threadId"]).index("byMessageId", ["messageId"]),
   sharedThreads: defineTable(SharedThread).index("byAuthorId", ["authorId"]),
   streams: defineTable(ResumableStream).index("byThreadId", ["threadId"]),
   // apiKeys: defineTable(ApiKey)
   //     .index("byUser", ["userId"])
   //     .index("byUserProvider", ["userId", "provider"]),
   settings: defineTable(UserSettings).index("byUser", ["userId"]),

   usageEvents: defineTable(UsageEvent).index("byUserDay", ["userId", "daysSinceEpoch"]),

   projects: defineTable(Project)
      .index("byAuthor", ["authorId"])
      .searchIndex("search_name", {
         searchField: "name",
         filterFields: ["authorId"],
      }),
});
