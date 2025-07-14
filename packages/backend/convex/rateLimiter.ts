import { MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";
import { DOCUMENT_CREATION_RATE_LIMIT } from "@docsurf/utils/constants/constants";
import { PLANS } from "@docsurf/utils/constants/pricing";
// Fallback for DAY if not exported from the package
const DAY = 24 * 60 * 60 * 1000;

const freePlan = PLANS.find((plan) => plan.name === "Free");

export const rateLimiter = new RateLimiter(components.rateLimiter, {
   // Limit how fast a user can add a new todo.
   addTodo: { kind: "token bucket", rate: 10, period: MINUTE, capacity: 3 },

   // Limit how fast a user can mutate (toggle, delete) todos.
   mutateTodo: { kind: "token bucket", rate: 20, period: MINUTE, capacity: 5 },

   // Limit document creation to DOCUMENT_CREATION_RATE_LIMIT per day per user
   // - 'rate': how many tokens are added to the bucket per period (max actions per period)
   // - 'period': the time window for the rate limit (in ms); here, one day
   // - 'capacity': the maximum number of tokens the bucket can hold (max burst size, usually same as rate for daily limits)
   createDocument: {
      kind: "token bucket",
      rate: DOCUMENT_CREATION_RATE_LIMIT, // Allow up to DOCUMENT_CREATION_RATE_LIMIT actions per period
      period: DAY, // The period is one day (24 hours)
      capacity: DOCUMENT_CREATION_RATE_LIMIT, // Max burst = daily limit
   },

   // Limit file uploads to prevent abuse while still being user-friendly
   // Limit to 100 uploads per day per user
   uploadFile: {
      kind: "token bucket",
      rate: freePlan?.limits.uploads1d ?? 10, // 10 uploads per day
      period: DAY, // 1 day in milliseconds
      capacity: freePlan?.limits.uploads1d ?? 10, // Allow burst of 10 uploads
   },
});
