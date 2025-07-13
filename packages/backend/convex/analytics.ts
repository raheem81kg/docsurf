import { v } from "convex/values";
import { query } from "./_generated/server";
import { internalQuery } from "./_generated/server";
import { getUserIdentity } from "./lib/identity";
import { MODELS_SHARED } from "./lib/models";
import { Id } from "./_generated/dataModel";

const getDaysSinceEpoch = (daysAgo: number) => Math.floor(Date.now() / (24 * 60 * 60 * 1000)) - daysAgo;

const getHoursSinceEpoch = (hoursAgo: number) => Math.floor(Date.now() / (60 * 60 * 1000)) - hoursAgo;

export const getMyUsageStats = query({
   args: {
      timeframe: v.union(v.literal("1d"), v.literal("7d"), v.literal("30d")),
   },
   handler: async (ctx, { timeframe }) => {
      const user = await getUserIdentity(ctx, { allowAnons: false });
      if ("error" in user) {
         return {
            modelStats: [],
            timeframe,
            totalRequests: 0,
            totalTokens: 0,
         };
      }

      const days = timeframe === "1d" ? 1 : timeframe === "7d" ? 7 : 30;
      const startDay = getDaysSinceEpoch(days);

      // Get user's events in time range - super efficient with the index
      const events = await ctx.db
         .query("usageEvents")
         .withIndex("byUserDay", (q) => q.eq("userId", user.id as Id<"users">).gte("daysSinceEpoch", startDay))
         .collect();

      // Charged events (charged === true)
      const chargedEvents = events.filter((e) => e.charged === true);

      // Post-filter by model and aggregate
      const modelStats = MODELS_SHARED.map((model) => {
         const modelEvents = events.filter((e) => e.modelId === model.id);
         const chargedModelEvents = chargedEvents.filter((e) => e.modelId === model.id);
         return {
            modelId: model.id,
            modelName: model.name,
            requests: modelEvents.length,
            promptTokens: modelEvents.reduce((sum, e) => sum + e.p, 0),
            completionTokens: modelEvents.reduce((sum, e) => sum + e.c, 0),
            reasoningTokens: modelEvents.reduce((sum, e) => sum + e.r, 0),
            totalTokens: modelEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
            chargedRequests: chargedModelEvents.length,
            chargedPromptTokens: chargedModelEvents.reduce((sum, e) => sum + e.p, 0),
            chargedCompletionTokens: chargedModelEvents.reduce((sum, e) => sum + e.c, 0),
            chargedReasoningTokens: chargedModelEvents.reduce((sum, e) => sum + e.r, 0),
            chargedTotalTokens: chargedModelEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
         };
      }).filter((stat) => stat.requests > 0);

      const totalRequests = events.length;
      const totalTokens = events.reduce((sum, e) => sum + e.p + e.c + e.r, 0);
      const chargedRequests = chargedEvents.length;
      const chargedTokens = chargedEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0);

      return {
         modelStats,
         timeframe,
         totalRequests,
         totalTokens,
         chargedRequests,
         chargedTokens,
      };
   },
});

export const getMyUsageChartData = query({
   args: {
      timeframe: v.union(v.literal("1d"), v.literal("7d"), v.literal("30d")),
   },
   handler: async (
      ctx,
      { timeframe }
   ): Promise<
      {
         daysSinceEpoch?: number;
         hoursSinceEpoch?: number;
         date: string;
         totalRequests: number;
         totalTokens: number;
         models: Record<
            string,
            {
               requests: number;
               tokens: number;
               promptTokens: number;
               completionTokens: number;
               reasoningTokens: number;
            }
         >;
      }[]
   > => {
      const user = await getUserIdentity(ctx, { allowAnons: false });
      if ("error" in user) return [];

      // For 1d, we want hourly granularity
      if (timeframe === "1d") {
         const hours = 24;
         const startTime = Date.now() - hours * 60 * 60 * 1000;

         // Get user's events in the last 24 hours
         const events = await ctx.db
            .query("usageEvents")
            .withIndex("byUserDay", (q) => q.eq("userId", user.id as Id<"users">))
            .filter((q) => q.gte(q.field("_creationTime"), startTime))
            .collect();

         // Charged events (charged === true)
         const chargedEvents = events.filter((e) => e.charged === true);

         // Group by hour
         const chartData = [];
         for (let i = hours - 1; i >= 0; i--) {
            const hourStart = Date.now() - i * 60 * 60 * 1000;
            const hourEnd = Date.now() - (i - 1) * 60 * 60 * 1000;
            const hourEvents = events.filter((e) => e._creationTime >= hourStart && e._creationTime < hourEnd);
            const chargedHourEvents = chargedEvents.filter((e) => e._creationTime >= hourStart && e._creationTime < hourEnd);

            const hourData = {
               hoursSinceEpoch: Math.floor(hourStart / (60 * 60 * 1000)),
               date: new Date(hourStart).toISOString(),
               totalRequests: hourEvents.length,
               totalTokens: hourEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
               chargedRequests: chargedHourEvents.length,
               chargedTokens: chargedHourEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
               models: {} as Record<
                  string,
                  {
                     requests: number;
                     tokens: number;
                     promptTokens: number;
                     completionTokens: number;
                     reasoningTokens: number;
                     chargedRequests: number;
                     chargedTokens: number;
                     chargedPromptTokens: number;
                     chargedCompletionTokens: number;
                     chargedReasoningTokens: number;
                  }
               >,
            };

            // Post-filter by model for this hour
            MODELS_SHARED.forEach((model) => {
               const modelEvents = hourEvents.filter((e) => e.modelId === model.id);
               const chargedModelEvents = chargedHourEvents.filter((e) => e.modelId === model.id);
               if (modelEvents.length > 0) {
                  hourData.models[model.id] = {
                     requests: modelEvents.length,
                     tokens: modelEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
                     promptTokens: modelEvents.reduce((sum, e) => sum + e.p, 0),
                     completionTokens: modelEvents.reduce((sum, e) => sum + e.c, 0),
                     reasoningTokens: modelEvents.reduce((sum, e) => sum + e.r, 0),
                     chargedRequests: chargedModelEvents.length,
                     chargedTokens: chargedModelEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
                     chargedPromptTokens: chargedModelEvents.reduce((sum, e) => sum + e.p, 0),
                     chargedCompletionTokens: chargedModelEvents.reduce((sum, e) => sum + e.c, 0),
                     chargedReasoningTokens: chargedModelEvents.reduce((sum, e) => sum + e.r, 0),
                  };
               }
            });

            chartData.push(hourData);
         }

         return chartData;
      }

      // Original daily logic for 7d and 30d
      const days = timeframe === "7d" ? 7 : 30;
      const startDay = getDaysSinceEpoch(days);

      // Get user's events in time range
      const events = await ctx.db
         .query("usageEvents")
         .withIndex("byUserDay", (q) => q.eq("userId", user.id as Id<"users">).gte("daysSinceEpoch", startDay))
         .collect();

      // Charged events (charged === true)
      const chargedEvents = events.filter((e) => e.charged === true);

      // Group by day
      const chartData = [];
      for (let i = days - 1; i >= 0; i--) {
         const daysSince = getDaysSinceEpoch(i);
         const dayEvents = events.filter((e) => e.daysSinceEpoch === daysSince);
         const chargedDayEvents = chargedEvents.filter((e) => e.daysSinceEpoch === daysSince);

         const dayData = {
            daysSinceEpoch: daysSince,
            date: new Date(daysSince * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            totalRequests: dayEvents.length,
            totalTokens: dayEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
            chargedRequests: chargedDayEvents.length,
            chargedTokens: chargedDayEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
            models: {} as Record<
               string,
               {
                  requests: number;
                  tokens: number;
                  promptTokens: number;
                  completionTokens: number;
                  reasoningTokens: number;
                  chargedRequests: number;
                  chargedTokens: number;
                  chargedPromptTokens: number;
                  chargedCompletionTokens: number;
                  chargedReasoningTokens: number;
               }
            >,
         };

         // Post-filter by model for this day
         MODELS_SHARED.forEach((model) => {
            const modelEvents = dayEvents.filter((e) => e.modelId === model.id);
            const chargedModelEvents = chargedDayEvents.filter((e) => e.modelId === model.id);
            if (modelEvents.length > 0) {
               dayData.models[model.id] = {
                  requests: modelEvents.length,
                  tokens: modelEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
                  promptTokens: modelEvents.reduce((sum, e) => sum + e.p, 0),
                  completionTokens: modelEvents.reduce((sum, e) => sum + e.c, 0),
                  reasoningTokens: modelEvents.reduce((sum, e) => sum + e.r, 0),
                  chargedRequests: chargedModelEvents.length,
                  chargedTokens: chargedModelEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
                  chargedPromptTokens: chargedModelEvents.reduce((sum, e) => sum + e.p, 0),
                  chargedCompletionTokens: chargedModelEvents.reduce((sum, e) => sum + e.c, 0),
                  chargedReasoningTokens: chargedModelEvents.reduce((sum, e) => sum + e.r, 0),
               };
            }
         });

         chartData.push(dayData);
      }

      return chartData;
   },
});

export const getMyModelUsage = query({
   args: {
      modelId: v.string(),
      timeframe: v.union(v.literal("1d"), v.literal("7d"), v.literal("30d")),
   },
   handler: async (ctx, { modelId, timeframe }) => {
      const user = await getUserIdentity(ctx, { allowAnons: false });
      if ("error" in user) {
         return {
            modelId,
            requests: 0,
            promptTokens: 0,
            completionTokens: 0,
            reasoningTokens: 0,
            totalTokens: 0,
         };
      }

      const days = timeframe === "1d" ? 1 : timeframe === "7d" ? 7 : 30;
      const startDay = getDaysSinceEpoch(days);

      // Get user's events, then filter by model
      const events = await ctx.db
         .query("usageEvents")
         .withIndex("byUserDay", (q) => q.eq("userId", user.id as Id<"users">).gte("daysSinceEpoch", startDay))
         .filter((q) => q.eq(q.field("modelId"), modelId))
         .collect();

      // Charged events (charged === true)
      const chargedEvents = events.filter((e) => e.charged === true);

      return {
         modelId,
         requests: events.length,
         promptTokens: events.reduce((sum, e) => sum + e.p, 0),
         completionTokens: events.reduce((sum, e) => sum + e.c, 0),
         reasoningTokens: events.reduce((sum, e) => sum + e.r, 0),
         totalTokens: events.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
         chargedRequests: chargedEvents.length,
         chargedPromptTokens: chargedEvents.reduce((sum, e) => sum + e.p, 0),
         chargedCompletionTokens: chargedEvents.reduce((sum, e) => sum + e.c, 0),
         chargedReasoningTokens: chargedEvents.reduce((sum, e) => sum + e.r, 0),
         chargedTotalTokens: chargedEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
         timeframe,
      };
   },
});

export const getUserUsageStats = internalQuery({
   args: {
      userId: v.id("users"),
      timeframe: v.union(v.literal("1d"), v.literal("7d"), v.literal("30d")),
   },
   handler: async (ctx, { userId, timeframe }) => {
      const days = timeframe === "1d" ? 1 : timeframe === "7d" ? 7 : 30;
      const startDay = getDaysSinceEpoch(days);

      // Get user's events in time range - super efficient with the index
      const events = await ctx.db
         .query("usageEvents")
         .withIndex("byUserDay", (q) => q.eq("userId", userId).gte("daysSinceEpoch", startDay))
         .collect();

      // Charged events (charged === true)
      const chargedEvents = events.filter((e) => e.charged === true);

      // Post-filter by model and aggregate
      const modelStats = MODELS_SHARED.map((model) => {
         const modelEvents = events.filter((e) => e.modelId === model.id);
         const chargedModelEvents = chargedEvents.filter((e) => e.modelId === model.id);
         return {
            modelId: model.id,
            modelName: model.name,
            requests: modelEvents.length,
            promptTokens: modelEvents.reduce((sum, e) => sum + e.p, 0),
            completionTokens: modelEvents.reduce((sum, e) => sum + e.c, 0),
            reasoningTokens: modelEvents.reduce((sum, e) => sum + e.r, 0),
            totalTokens: modelEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
            chargedRequests: chargedModelEvents.length,
            chargedPromptTokens: chargedModelEvents.reduce((sum, e) => sum + e.p, 0),
            chargedCompletionTokens: chargedModelEvents.reduce((sum, e) => sum + e.c, 0),
            chargedReasoningTokens: chargedModelEvents.reduce((sum, e) => sum + e.r, 0),
            chargedTotalTokens: chargedModelEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0),
         };
      }).filter((stat) => stat.requests > 0);

      const totalRequests = events.length;
      const totalTokens = events.reduce((sum, e) => sum + e.p + e.c + e.r, 0);
      const chargedRequests = chargedEvents.length;
      const chargedTokens = chargedEvents.reduce((sum, e) => sum + e.p + e.c + e.r, 0);

      return {
         modelStats,
         timeframe,
         totalRequests,
         totalTokens,
         chargedRequests,
         chargedTokens,
      };
   },
});
