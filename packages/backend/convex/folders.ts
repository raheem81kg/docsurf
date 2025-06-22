import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { aggregrateThreadsByFolder } from "./aggregates"
import { getUserIdentity } from "./lib/identity"

// Create a new project
export const createProject = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        color: v.optional(v.string()),
        icon: v.optional(v.string()),
        customPrompt: v.optional(v.string()),
        defaultModel: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const user = await getUserIdentity(ctx.auth, { allowAnons: false })
        if ("error" in user) return { error: user.error }

        const projectId = await ctx.db.insert("projects", {
            ...args,
            authorId: user.id,
            createdAt: Date.now(),
            updatedAt: Date.now()
        })

        return { projectId }
    }
})

// Get all projects for the current user
export const getUserProjects = query({
    args: {},
    handler: async (ctx) => {
        const user = await getUserIdentity(ctx.auth, { allowAnons: true })
        if ("error" in user) return []

        const projects = await ctx.db
            .query("projects")
            .withIndex("byAuthor", (q) => q.eq("authorId", user.id))
            .filter((q) => q.neq(q.field("archived"), true))
            .order("desc")
            .collect()

        return await Promise.all(
            projects.map(async (project) => {
                const aggregate = await aggregrateThreadsByFolder.count(ctx, {
                    namespace: [user.id, project._id],
                    bounds: {}
                })
                return { ...project, threadCount: aggregate }
            })
        )
    }
})

// Get a specific project
export const getProject = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, { projectId }) => {
        const user = await getUserIdentity(ctx.auth, { allowAnons: true })
        if ("error" in user) return null

        const project = await ctx.db.get(projectId)
        if (!project || project.authorId !== user.id) return null

        const aggregate = await aggregrateThreadsByFolder.count(ctx, {
            namespace: [user.id, projectId],
            bounds: {}
        })

        return { ...project, threadCount: aggregate }
    }
})

// Update a project
export const updateProject = mutation({
    args: {
        projectId: v.id("projects"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        color: v.optional(v.string()),
        icon: v.optional(v.string()),
        customPrompt: v.optional(v.string()),
        defaultModel: v.optional(v.string())
    },
    handler: async (ctx, { projectId, ...updates }) => {
        const user = await getUserIdentity(ctx.auth, { allowAnons: false })
        if ("error" in user) return { error: user.error }

        const project = await ctx.db.get(projectId)
        if (!project || project.authorId !== user.id) {
            return { error: "Project not found or unauthorized" }
        }

        await ctx.db.patch(projectId, {
            ...updates,
            updatedAt: Date.now()
        })

        return { success: true }
    }
})

// Delete/Archive a project
export const deleteProject = mutation({
    args: { projectId: v.id("projects") },
    handler: async (ctx, { projectId }) => {
        const user = await getUserIdentity(ctx.auth, { allowAnons: false })
        if ("error" in user) return { error: user.error }

        const project = await ctx.db.get(projectId)
        if (!project || project.authorId !== user.id) {
            return { error: "Project not found or unauthorized" }
        }

        // Check if project has threads
        const threadsInProject = await ctx.db
            .query("threads")
            .withIndex("byAuthorAndProject", (q) =>
                q.eq("authorId", user.id).eq("projectId", projectId)
            )
            .first()

        if (threadsInProject) {
            // Archive instead of delete if it has threads
            await ctx.db.patch(projectId, {
                archived: true,
                updatedAt: Date.now()
            })
            return { success: true, archived: true }
        }

        // Actually delete if no threads
        await ctx.db.delete(projectId)
        return { success: true, deleted: true }
    }
})

// Move thread to project
export const moveThreadToProject = mutation({
    args: {
        threadId: v.id("threads"),
        projectId: v.optional(v.id("projects")) // null to move to "no project"
    },
    handler: async (ctx, { threadId, projectId }) => {
        const user = await getUserIdentity(ctx.auth, { allowAnons: false })
        if ("error" in user) return { error: user.error }

        const thread = await ctx.db.get(threadId)
        if (!thread || thread.authorId !== user.id) {
            return { error: "Thread not found or unauthorized" }
        }

        // If moving to a project, verify the project exists and belongs to user
        if (projectId) {
            const project = await ctx.db.get(projectId)
            if (!project || project.authorId !== user.id) {
                return { error: "Project not found or unauthorized" }
            }
        }

        await ctx.db.patch(threadId, {
            projectId,
            updatedAt: Date.now()
        })
        const newDoc = await ctx.db.get(threadId)
        await aggregrateThreadsByFolder.replace(ctx, thread!, newDoc!)

        return { success: true }
    }
})

// Search projects
export const searchProjects = query({
    args: {
        query: v.string(),
        paginationOpts: paginationOptsValidator
    },
    handler: async (ctx, { query, paginationOpts }) => {
        const user = await getUserIdentity(ctx.auth, { allowAnons: true })
        if ("error" in user) {
            return {
                page: [],
                isDone: true,
                continueCursor: ""
            }
        }

        if (!query.trim()) {
            return await ctx.db
                .query("projects")
                .withIndex("byAuthor", (q) => q.eq("authorId", user.id))
                .filter((q) => q.neq(q.field("archived"), true))
                .order("desc")
                .paginate(paginationOpts)
        }

        return await ctx.db
            .query("projects")
            .withSearchIndex("search_name", (q) =>
                q.search("name", query.trim()).eq("authorId", user.id)
            )
            .filter((q) => q.neq(q.field("archived"), true))
            .paginate(paginationOpts)
    }
})
