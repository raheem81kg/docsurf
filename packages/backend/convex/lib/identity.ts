import type { GenericActionCtx, GenericQueryCtx } from "convex/server";
import { betterAuthComponent } from "../auth";
import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { requireUserId } from "../users";
import { LRUCache } from "lru-cache";

// In-memory cache to check if a user has access to a workspace
const cache = new LRUCache<string, boolean>({
   max: 5_000, // up to 5k entries (adjust based on memory)
   ttl: 1000 * 60 * 30, // 30 minutes in milliseconds
});

// Better Auth identity type
type BetterAuthIdentity = {
   image?: string | undefined;
   twoFactorEnabled?: boolean | undefined;
   name: string;
   email: string;
   emailVerified: boolean;
   userId: string;
   createdAt: number;
   updatedAt: number;
};

type Identity<T extends boolean> = BetterAuthIdentity & {
   isAnonymous: T extends false ? false : boolean;
   id: string;
};

export const getUserIdentity = async <T extends boolean>(
   ctx: GenericQueryCtx<any> | GenericActionCtx<any>,
   { allowAnons }: { allowAnons: T }
): Promise<{ error: string } | Identity<T>> => {
   const identity: BetterAuthIdentity | null = await betterAuthComponent.getAuthUser(ctx);

   if (!identity) {
      return { error: "Unauthorized" };
   }

   // The concept of "anonymous" users may need to be adapted based on better-auth's user model
   // For now, we assume if an identity exists, it is not anonymous.
   // const isAnonymous = false;
   // if (!allowAnons && isAnonymous) {
   // 	return { error: "Unauthorized (anonymous)" };
   // }

   return {
      ...identity,
      isAnonymous: false,
      id: identity.userId,
   } as Identity<T>;
};

export const getOrThrowUserIdentity = async <T extends boolean>(
   ctx: GenericQueryCtx<any> | GenericActionCtx<any>,
   { allowAnons }: { allowAnons: T }
): Promise<Identity<T>> => {
   const result = await getUserIdentity(ctx, { allowAnons });

   if ("error" in result) {
      throw new Error(result.error === "Unauthorized" ? "Unauthorized" : "User not authenticated");
   }

   return result;
};

/**
 * Convex-style wrapper for workspace permission checks.
 * Usage:
 *   export const myMutation = mutation(
 *     withWorkspacePermissionWrapper(async (ctx, { workspaceId, userId, workspaceRole, ...args }) => {
 *       // ...
 *     })
 *   );
 *
 * Adds userId and workspaceRole to args if allowed, else throws.
 */
export function withWorkspacePermissionWrapper<Args extends { workspaceId: string }, ReturnType>(
   handler: (
      ctx: QueryCtx | MutationCtx,
      args: Args & { userId: string; workspaceRole: "owner" | "admin" | "member" | null }
   ) => Promise<ReturnType>
) {
   return async (ctx: QueryCtx | MutationCtx, args: Args): Promise<ReturnType> => {
      // Get userId from session/auth (Convex: requireUserId)
      const userId = await requireUserId(ctx);
      // Fetch user by _id (no index needed)
      const user = await ctx.db.get(userId);
      if (!user) {
         throw new ConvexError({
            code: "not_found",
            message: "User not found",
            statusCode: 404,
         });
      }
      // Get all memberships for this user
      const memberships = await ctx.db
         .query("usersOnWorkspace")
         .withIndex("by_user", (q) => q.eq("userId", userId))
         .collect();
      // Find the requested workspaceId in memberships
      const workspaceId = args.workspaceId;
      const membership = memberships.find((m) => m.workspaceId === workspaceId) || null;
      // If workspaceId is null, allow (user has no workspace assigned)
      if (workspaceId === null) {
         return handler(ctx, { ...args, userId, workspaceRole: null });
      }
      // Check cache for access
      const cacheKey = `user:${userId}:workspace:${workspaceId}`;
      let hasAccess = cache.get(cacheKey);
      if (hasAccess === undefined) {
         hasAccess = !!membership;
         cache.set(cacheKey, hasAccess);
      }
      if (!hasAccess) {
         throw new ConvexError({
            code: "forbidden",
            message: "No permission to access this workspace",
            statusCode: 403,
         });
      }
      return handler(ctx, { ...args, userId, workspaceRole: membership ? membership.role : null });
   };
}

export async function requireWorkspacePermission(
   ctx: QueryCtx | MutationCtx,
   workspaceId: Id<"workspaces">
): Promise<{ userId: Id<"users">; workspaceRole: "owner" | "admin" | "member" | null }> {
   const userId = await requireUserId(ctx);
   const memberships = await ctx.db
      .query("usersOnWorkspace")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
   const membership = memberships.find((m) => m.workspaceId === workspaceId) || null;
   if (!membership) {
      throw new ConvexError({
         code: "forbidden",
         message: "No permission to access this workspace",
         statusCode: 403,
      });
   }
   return { userId, workspaceRole: membership.role };
}
