import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { polar } from "./polar";

export type SafeSubscription = {
   currentPeriodStart: string;
   currentPeriodEnd: string | null;
} | null;

export const getSubscription = internalQuery({
   args: { userId: v.id("users") },
   handler: async (ctx, { userId }): Promise<SafeSubscription | null> => {
      let safeSubscription: SafeSubscription = null;

      try {
         const subscription = await polar.getCurrentSubscription(ctx, {
            userId,
         });

         if (subscription) {
            safeSubscription = {
               currentPeriodStart: subscription.currentPeriodStart,
               currentPeriodEnd: subscription.currentPeriodEnd,
            };
         }
      } catch {
         console.error("Error getting subscription");
      }

      return safeSubscription;
   },
});
