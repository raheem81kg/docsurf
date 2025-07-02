import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { UserSettings } from "./schema/settings";
import { Message } from "./schema/message";
import { SharedThread, Thread } from "./schema/thread";
import { UsageEvent } from "./schema/usage";
import { Project } from "./schema/folders";
import { ResumableStream } from "./schema/streams";
import { Documents } from "./schema/documents";
import { Workspaces, UsersOnWorkspace } from "./schema/workspace";

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

   documents: defineTable(Documents)
      .index("byUser", ["authorId"])
      .index("byParentId", ["parentId"])
      .index("byWorkspaceUpdated", ["workspaceId", "updatedAt"])
      .index("byWorkspaceDeleted", ["workspaceId", "isDeleted"])
      .index("byParentOrder", ["parentId", "orderPosition"])
      .index("byUserWorkspaceDeleted", ["authorId", "workspaceId", "isDeleted"])
      .searchIndex("search_title", {
         searchField: "title",
         filterFields: ["workspaceId", "authorId", "isDeleted"],
      }),

   // apiKeys: defineTable({
   //    userId: v.id("users"),
   //    service: v.union(v.literal("gemini"), v.literal("groq"), v.literal("openrouter"), v.literal("deepgram")),
   //    name: v.string(),
   //    key: v.string(),
   //    is_default: v.optional(v.boolean()),
   // }).index("by_user_and_service", ["userId", "service"]),

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

   usersOnWorkspace: defineTable(UsersOnWorkspace)
      .index("by_workspace_user", ["workspaceId", "userId"])
      .index("by_user", ["userId"])
      .index("by_workspace", ["workspaceId"])
      .index("by_role_workspace", ["role", "workspaceId"]),

   workspaces: defineTable(Workspaces).index("by_created_at", ["createdAt"]).index("by_slug", ["slug"]),
});
