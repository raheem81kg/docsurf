import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { polar } from "./polar";

export type SafeSubscription = {
   currentPeriodStart: string | null;
   currentPeriodEnd: string | null;
   isPremium: boolean;
   isFree: boolean;
} | null;

export const getSubscription = internalQuery({
   args: { userId: v.id("users") },
   handler: async (ctx, { userId }): Promise<SafeSubscription | null> => {
      let safeSubscription: SafeSubscription = {
         currentPeriodStart: null,
         currentPeriodEnd: null,
         isPremium: false,
         isFree: true,
      };

      try {
         const subscription = await polar.getCurrentSubscription(ctx, {
            userId,
         });

            safeSubscription = {
               currentPeriodStart: subscription?.currentPeriodStart ?? null,
               currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
               isPremium: !!subscription,
               isFree: !subscription,
         };
      } catch {
         console.error("Error getting subscription");
      }

      return safeSubscription;
   },
});
