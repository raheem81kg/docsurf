import { v } from "convex/values"
import { internalMutation, internalQuery } from "./_generated/server"

export const getStreamsByThreadId = internalQuery({
    args: { threadId: v.id("threads") },
    handler: async ({ db }, { threadId }) => {
        return await db
            .query("streams")
            .withIndex("byThreadId", (q) => q.eq("threadId", threadId))
            .collect()
    }
})

export const appendStreamId = internalMutation({
    args: { threadId: v.id("threads") },
    handler: async ({ db }, { threadId }) => {
        return await db.insert("streams", { threadId, createdAt: Date.now() })
    }
})
