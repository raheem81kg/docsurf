import { v } from "convex/values"

export const ResumableStream = v.object({
    threadId: v.id("threads"),
    createdAt: v.number()
})
