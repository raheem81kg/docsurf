# Convex Development Patterns

This document outlines important patterns to follow when developing with Convex to avoid common pitfalls, especially regarding client-server code separation.

## Isolating Server-Only Dependencies

### The Problem

When building a full-stack application with Convex and a modern frontend framework (like Vite with SSR), the bundler analyzes your code to create a client-side bundle. If a file that's used by the client (e.g., a file containing a public query like `api.auth.getCurrentUser`) contains a `import` statement for a server-only package, the bundler will try to include that package in the client bundle.

This leads to `ERR_MODULE_NOT_FOUND` errors, because packages like `@convex-dev/polar` are designed to run only on the Convex backend, not in a browser environment.

For example, this code will cause a build error because `polar` is imported directly into `auth.ts`, which exports a query used by the frontend:

**`packages/backend/convex/auth.ts` (Incorrect Approach)**

```typescript
import { query } from "./_generated/server";
import { polar } from "./polar"; // <-- PROBLEM: This gets bundled for the client

export const getCurrentUser = query({
   args: {},
   handler: async (ctx) => {
      const userMetadata = await betterAuthComponent.getAuthUser(ctx);
      if (!userMetadata) {
         return null;
      }
      // This line causes the bundler to include "polar" on the client.
      const subscription = await polar.getCurrentSubscription(ctx, { userId: userMetadata.userId });

      return {
         // ...
      };
   },
});
```

### The Solution

To solve this, we must isolate all server-only logic into dedicated files that are **never** directly imported by client-facing code. We then expose this logic through `internalQuery` or `internalMutation`.

Client-facing queries can then use `ctx.runQuery` or `ctx.runMutation` to execute this internal logic securely on the server, without ever importing the server-only package itself.

### Example Implementation

Here is how we solved the issue with `@convex-dev/polar`:

**1. Create a dedicated file for the server-only logic:**

We created a new file, `subscriptions.ts`, to handle all interactions with the `polar` package.

**`packages/backend/convex/subscriptions.ts`**

```typescript
import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { polar } from "./polar";

type SubscriptionStatus = { isFree: boolean; isPremium: boolean };

export const getSubscription = internalQuery({
   args: { userId: v.id("users") },
   handler: async (ctx, { userId }): Promise<SubscriptionStatus> => {
      const subscription = await polar.getCurrentSubscription(ctx, {
         userId,
      });
      return {
         isFree: !subscription,
         isPremium: !!subscription,
      };
   },
});
```

**2. Call the internal query from the public query:**

The `auth.ts` file can now safely get subscription data without importing `polar`. It calls the internal query via `ctx.runQuery`.

**`packages/backend/convex/auth.ts` (Correct Approach)**

```typescript
import { query } from "./_generated/server";
import { internal } from "./_generated/api";
// ... other imports, but NOT "polar"

type SubscriptionStatus = { isFree: boolean; isPremium: boolean };

// Note: betterAuthComponent is assumed to be defined elsewhere in the file.
declare const betterAuthComponent: any;

export const getCurrentUser = query({
   args: {},
   handler: async (ctx) => {
      const userMetadata = await betterAuthComponent.getAuthUser(ctx);
      if (!userMetadata) {
         return null;
      }

      const user = await ctx.db.get(userMetadata.userId as Id<"users">);
      const subscription: SubscriptionStatus = await ctx.runQuery(
         internal.subscriptions.getSubscription, // <-- Safely call the internal query
         {
            userId: userMetadata.userId as Id<"users">,
         }
      );

      return {
         ...user,
         ...userMetadata,
         isFree: subscription.isFree,
         isPremium: subscription.isPremium,
      };
   },
});
```

By following this pattern, we ensure a clean separation between server and client code, preventing build errors and creating a more robust application architecture.
