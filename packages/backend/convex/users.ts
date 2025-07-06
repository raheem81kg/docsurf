import { type ActionCtx, type QueryCtx, query, internalQuery } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
// import { SafeSubscription } from "./subscriptions";
import { v } from "convex/values";

type CurrentUserMetadata = {
   image?: string | undefined;
   twoFactorEnabled?: boolean | undefined;
   name?: string | undefined;
   email: string;
   emailVerified: boolean;
   userId: string;
   createdAt: number;
   updatedAt: number;
} | null;

// The user object returned by the getCurrentUser query. It combines authentication
// data with the user's subscription status and application-specific data.
export type CurrentUser =
   | (Doc<"users"> &
        CurrentUserMetadata & {
           //   subscription: SafeSubscription | null;
           workspaces: Array<{ workspace: Doc<"workspaces">; role: string }>;
        })
   | null;

// export const resetCredits = internalMutation({
//    args: {},
//    handler: async (ctx) => {
//       const users = await ctx.db.query("users").collect();
//       for (const user of users) {
//          await ctx.db.patch(user._id, {
//             creditsUsed: 0,
//          });
//       }
//    },
// });

// export const checkUserCredits = (_: GenericCtx, user: UserWithMetadata, cost: number) => {
//    const maxCredits = user.isPremium ? PRO_CREDITS : FREE_CREDITS;
//    const creditsUsed = user.creditsUsed ?? 0;

//    const availableCredits = maxCredits - creditsUsed;

//    if (cost === 0) {
//       return true;
//    }

//    if (availableCredits < cost) {
//       return false;
//    }

//    return true;
// };

export const getUserId = async (ctx: QueryCtx | ActionCtx) => {
   const identity = await ctx.auth.getUserIdentity();
   return (identity?.subject as Id<"users">) ?? null;
};

export const requireUserId = async (ctx: QueryCtx | ActionCtx) => {
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

export const getUser = query({
   args: { userId: v.id("users") },
   handler: async (ctx, { userId }) => {
      return await ctx.db.get(userId);
   },
});

export const getUserInternal = internalQuery({
   args: { userId: v.id("users") },
   handler: async (ctx, { userId }) => {
      return await ctx.db.get(userId);
   },
});
