// workspace.ts
// Convex schema for workspaces and workspace membership, including role enum.
import { v } from "convex/values";

// Enum for workspace roles
export const workspaceRoleEnum = ["owner", "member", "admin"] as const;

// Workspaces table schema
export const Workspaces = v.object({
   name: v.string(),
   slug: v.optional(v.string()),
   description: v.optional(v.string()),
   createdAt: v.number(),
});

// Workspace members table schema
export const UsersOnWorkspace = v.object({
   workspaceId: v.id("workspaces"),
   userId: v.id("users"),
   role: v.union(v.literal("owner"), v.literal("member"), v.literal("admin")),
   createdAt: v.number(),
});
