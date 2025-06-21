import { internalMutation, QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { internalQuery } from "./_generated/server";
import { betterAuthComponent } from "./auth";
import { ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";

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

export const getUserId = async (ctx: QueryCtx) => {
   const identity = await ctx.auth.getUserIdentity();
   return (identity?.subject as Id<"users">) ?? null;
};

export const requireUserId = async (ctx: QueryCtx) => {
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
