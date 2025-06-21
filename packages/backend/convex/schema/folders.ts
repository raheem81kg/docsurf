import { v } from "convex/values"

export const Project = v.object({
    name: v.string(),
    description: v.optional(v.string()),
    authorId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    color: v.optional(v.string()), // From fixed palette: "blue", "red", "green", "purple", "orange", "pink", "teal", "gray"
    icon: v.optional(v.string()), // Emoji or icon identifier
    customPrompt: v.optional(v.string()),
    defaultModel: v.optional(v.string()),
    archived: v.optional(v.boolean())
})
