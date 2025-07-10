import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./users";

export const createWorkspace = mutation({
   args: {
      name: v.optional(v.string()),
   },
   handler: async (ctx, { name }) => {
      const userId = await requireUserId(ctx);
      const user = await ctx.db.get(userId);
      if (!user) {
         throw new Error("User not found");
      }
      const now = Date.now();
      // Create the workspace
      const workspaceId = await ctx.db.insert("workspaces", {
         name: name ?? "My Workspace",
         createdAt: now,
      });
      // Add the user as owner
      await ctx.db.insert("usersOnWorkspace", {
         workspaceId,
         userId,
         role: "owner",
         createdAt: now,
      });
      return { workspaceId };
   },
});
