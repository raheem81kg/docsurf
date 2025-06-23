import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const getStreamsByThreadId = internalQuery({
   args: { threadId: v.id("threads") },
   handler: async ({ ...ctx }, { threadId }) => {
      return await ctx.db
         .query("streams")
         .withIndex("byThreadId", (q) => q.eq("threadId", threadId))
         .collect();
   },
});

export const appendStreamId = internalMutation({
   args: { threadId: v.id("threads") },
   handler: async ({ ...ctx }, { threadId }) => {
      return await ctx.db.insert("streams", { threadId, createdAt: Date.now() });
   },
});
