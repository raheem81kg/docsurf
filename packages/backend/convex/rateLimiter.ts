import { MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";
import { DOCUMENT_CREATION_RATE_LIMIT } from "@docsurf/utils/constants/constants";

// Fallback for DAY if not exported from the package
const DAY = 24 * 60 * 60 * 1000;

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
   // 100 uploads per hour should be generous for normal usage
   uploadFile: {
      kind: "token bucket",
      rate: 6, // 6 upload per hour
      period: 60 * 60 * 1000, // 1 hour in milliseconds
      capacity: 6, // Allow burst of 6 uploads
   },
});
