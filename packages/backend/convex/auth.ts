import { type AuthFunctions, BetterAuth, convexAdapter, type PublicAuthFunctions } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { getAppUrl } from "@docsurf/utils/envs";
import { betterAuth } from "better-auth";
import { emailOTP, magicLink, twoFactor } from "better-auth/plugins";
import { asyncMap } from "convex-helpers";
import { api, components, internal } from "./_generated/api";
import type { DataModel, Id, Doc } from "./_generated/dataModel";
import { type GenericCtx, query } from "./_generated/server";
import { sendEmailVerification, sendMagicLink, sendOTPVerification } from "./email";
import type { SafeSubscription } from "./subscriptions";

// The user object returned by the getCurrentUser query. It combines authentication
// data with the user's subscription status and application-specific data.
type CurrentUser = Doc<"users"> & SafeSubscription;

const authFunctions: AuthFunctions = internal.auth;
const publicAuthFunctions: PublicAuthFunctions = api.auth;

export const betterAuthComponent = new BetterAuth(components.betterAuth, {
   authFunctions,
   publicAuthFunctions,
   verbose: false,
});

// Default to localhost:3001 in development, but allow override via environment variable
// const getSiteUrl = () => {
//    // const envUrl = process.env.SITE_URL;
//    // if (envUrl) return envUrl;

//    // Default for local development
//    return "http://localhost:3001";
// };

export const createAuth = (ctx: GenericCtx) =>
   betterAuth({
      baseURL: getAppUrl(),
      database: convexAdapter(ctx, betterAuthComponent),
      account: {
         accountLinking: {
            enabled: true,
         },
      },
      emailVerification: {
         sendVerificationEmail: async ({ user, url }) => {
            await sendEmailVerification({
               to: user.email,
               url,
            });
         },
      },
      emailAndPassword: {
         enabled: false,
      },
      socialProviders: {
         google: {
            clientId: process.env.VITE_GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.VITE_GOOGLE_CLIENT_SECRET as string,
         },
      },
      user: {
         deleteUser: {
            enabled: true,
         },
      },
      plugins: [
         magicLink({
            sendMagicLink: async ({ email, url }) => {
               if (process.env.NODE_ENV === "development") {
                  console.log("Magic link sent to", email, "with url", url);
                  return;
               }
               await sendMagicLink({
                  to: email,
                  url,
               });
            },
         }),
         emailOTP({
            async sendVerificationOTP({ email, otp }) {
               if (process.env.NODE_ENV === "development") {
                  console.log("OTP verification email sent to", email, "with code", otp);
                  return;
               }
               await sendOTPVerification({
                  to: email,
                  code: otp,
               });
            },
         }),
         twoFactor(),
         convex(),
      ],
   });

export const { createUser, deleteUser, updateUser, createSession, isAuthenticated } =
   betterAuthComponent.createAuthFunctions<DataModel>({
      onCreateUser: async (ctx, user) => {
         // Example: copy the user's email to the application users table.
         // We'll use onUpdateUser to keep it synced.
         const userId = await ctx.db.insert("users", {
            name: user.name,
            email: user.email,
            image: user.image,
         });

         // This function must return the user id.
         return userId;
      },
      onDeleteUser: async (ctx, userId) => {
         // Delete the user's data if the user is being deleted
         const todos = await ctx.db
            .query("todos")
            .withIndex("userId", (q) => q.eq("userId", userId as Id<"users">))
            .collect();
         await asyncMap(todos, async (todo) => {
            await ctx.db.delete(todo._id);
         });
         await ctx.db.delete(userId as Id<"users">);

         // need to cancel the subscription even if not currently active
         // await ctx.scheduler.runAfter(0, api.polar.cancelCurrentSubscription, {});
      },
      onUpdateUser: async (ctx, user) => {
         // Keep the user's email synced
         const userId = user.userId as Id<"users">;
         await ctx.db.patch(userId, {
            email: user.email,
         });
      },
   });

// export const getSubscription = internalQuery({
//    args: { userId: v.id("users") },
//    handler: async (ctx, { userId }): Promise<SubscriptionStatus> => {
//       const subscription = await polar.getCurrentSubscription(ctx, {
//          userId,
//       });
//       return {
//          isFree: !subscription,
//          isPremium: !!subscription,
//       };
//    },
// });

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
   args: {},
   handler: async (ctx): Promise<CurrentUser | null> => {
      // Get user data from Better Auth - email, name, image, etc.
      const userMetadata = await betterAuthComponent.getAuthUser(ctx);
      if (!userMetadata) {
         return null;
      }

      // Get user data from your application's database (skip this if you have no
      // fields in your users table schema)
      const user = await ctx.db.get(userMetadata.userId as Id<"users">);
      if (!user) {
         return null;
      }
      const subscription: SafeSubscription = await ctx.runQuery(internal.subscriptions.getSubscription, {
         userId: userMetadata.userId as Id<"users">,
      });

      return {
         ...user,
         ...subscription,
      };
   },
});
