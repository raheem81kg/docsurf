import { type AuthFunctions, BetterAuth, convexAdapter, type PublicAuthFunctions } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { getConvexAppUrl } from "@docsurf/utils/envs";
import { betterAuth } from "better-auth";
import { emailOTP, magicLink, twoFactor } from "better-auth/plugins";
import { asyncMap } from "convex-helpers";
import { api, components, internal } from "./_generated/api";
import type { DataModel, Id, Doc } from "./_generated/dataModel";
import { type GenericCtx, query } from "./_generated/server";
import { sendEmailVerification, sendMagicLink, sendSignInOTP } from "./email";
import type { SafeSubscription } from "./subscriptions";
import gettingStartedContent from "./getting_started.json";
import type { CurrentUser } from "./users";

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
      baseURL: getConvexAppUrl(),
      database: convexAdapter(ctx, betterAuthComponent),
      account: {
         accountLinking: {
            enabled: true,
         },
      },
      // emailVerification: {
      //    sendVerificationEmail: async ({ user, url }) => {
      //       await sendEmailVerification({
      //          to: user.email,
      //          url,
      //       });
      //    },
      // },
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
         // magicLink({
         //    sendMagicLink: async ({ email, url }) => {
         //       if (process.env.NODE_ENV === "development") {
         //          console.log("Magic link sent to", email, "with url", url);
         //          return;
         //       }
         //       await sendMagicLink({
         //          to: email,
         //          url,
         //       });
         //    },
         // }),
         emailOTP({
            otpLength: 6,
            expiresIn: 10 * 60, // 10  mintutes
            allowedAttempts: 3,
            async sendVerificationOTP({ email, otp, type }) {
               if (process.env.NODE_ENV === "development") {
                  console.log("OTP verification email sent to", email, "with code", otp);
                  // return;
               }
               if (type === "sign-in") {
                  await sendSignInOTP({
                     to: email,
                     code: otp,
                  });
               }
            },
         }),
         twoFactor(),
         convex(),
      ],
   });

export const { createUser, deleteUser, updateUser, createSession, isAuthenticated } =
   betterAuthComponent.createAuthFunctions<DataModel>({
      onCreateUser: async (ctx, user) => {
         // If user.name is missing or empty, use the part of their email before the @ symbol, truncated to 100 characters.
         let name = user.name;
         if (!name || name.trim() === "") {
            if (user.email) {
               name = user.email.split("@")[0].slice(0, 100);
            } else {
               name = "Docsurf user";
            }
         }
         const userId = await ctx.db.insert("users", {
            name,
            email: user.email,
            image: user.image,
         });

         // Create a workspace for the user and assign them as owner
         const workspaceId = await ctx.db.insert("workspaces", {
            name: `${name}'s Workspace`,
            createdAt: Date.now(),
         });
         await ctx.db.insert("usersOnWorkspace", {
            workspaceId,
            userId,
            role: "owner",
            createdAt: Date.now(),
         });

         // Insert a Getting Started document for the new user
         await ctx.db.insert("documents", {
            authorId: userId,
            workspaceId,
            parentId: undefined,
            title: "Getting Started",
            documentType: "text/plain",
            fileUrl: undefined,
            content: JSON.stringify(gettingStartedContent),
            orderPosition: 0,
            updatedAt: Date.now(),
            isDeleted: false,
            depth: 0,
            isPublic: false,
            isLocked: false,
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
            name: user.name,
            image: user.image,
         });
      },
   });

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
   args: {},
   handler: async (ctx): Promise<CurrentUser> => {
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

      // Fetch all workspace memberships for this user
      const memberships = await ctx.db
         .query("usersOnWorkspace")
         .withIndex("by_user", (q) => q.eq("userId", user._id))
         .collect();
      // Fetch the workspace documents for each membership
      const workspaces = await Promise.all(
         memberships.map(async (m) => {
            const workspace = await ctx.db.get(m.workspaceId as Id<"workspaces">);
            return workspace ? { workspace, role: m.role } : null;
         })
      );

      const { name, ...userMetadataWithoutName } = userMetadata;

      return {
         ...userMetadataWithoutName,
         ...user,
         subscription,
         workspaces: workspaces.filter(Boolean) as Array<{ workspace: Doc<"workspaces">; role: string }>,
      };
   },
});
