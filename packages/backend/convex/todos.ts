import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";
import { rateLimiter } from "./rateLimiter";

const getUserId = async (ctx: QueryCtx) => {
	const identity = await ctx.auth.getUserIdentity();
	return (identity?.subject as Id<"users">) ?? null;
};

const requireUserId = async (ctx: QueryCtx) => {
	const userId = await getUserId(ctx);
	if (!userId) {
		throw new ConvexError({
			code: "not_authenticated",
			message: "Not authenticated",
			statusCode: 401,
		});
	}
	return userId;
};

// Migration mutation to add missing fields
export const migrateTodos = mutation({
	args: {},
	handler: async (ctx) => {
		// Get all todos
		const todos = await ctx.db.query("todos").collect();
		const now = Date.now();

		// Update each todo that's missing the required fields
		for (const todo of todos) {
			if (!todo.createdAt || !todo.updatedAt) {
				await ctx.db.patch(todo._id, {
					createdAt: todo.createdAt || now,
					updatedAt: todo.updatedAt || now,
					userId: todo.userId || (await getUserId(ctx)),
				});
			}
		}
	},
});

export const get = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getUserId(ctx);
		if (!userId) {
			return [];
		}
		return await ctx.db
			.query("todos")
			.withIndex("userId", (q) => q.eq("userId", userId))
			.order("desc")
			.collect();
	},
});

export const create = mutation({
	args: { text: v.string() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await rateLimiter.limit(ctx, "addTodo", { key: userId, throws: true });
		const now = Date.now();
		await ctx.db.insert("todos", {
			text: args.text,
			completed: false,
			userId,
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const toggle = mutation({
	args: { id: v.id("todos") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await rateLimiter.limit(ctx, "mutateTodo", { key: userId, throws: true });

		const todo = await ctx.db.get(args.id);
		if (!todo || todo.userId !== userId) {
			throw new Error("Todo not found or unauthorized");
		}

		await ctx.db.patch(args.id, {
			completed: !todo.completed,
			updatedAt: Date.now(),
		});
	},
});

export const remove = mutation({
	args: { id: v.id("todos") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await rateLimiter.limit(ctx, "mutateTodo", { key: userId, throws: true });

		const todo = await ctx.db.get(args.id);
		if (!todo || todo.userId !== userId) {
			throw new Error("Todo not found or unauthorized");
		}

		await ctx.db.delete(args.id);
	},
});

export const { getRateLimit: getAddTodoRateLimit, getServerTime } =
	rateLimiter.hookAPI("addTodo", {
		key: async (ctx) => {
			const identity = await ctx.auth.getUserIdentity();
			if (!identity) {
				// This should not happen if the component is on an authenticated page.
				// The client hook should handle the error state.
				throw new ConvexError("User is not authenticated.");
			}
			return identity.subject;
		},
	});
