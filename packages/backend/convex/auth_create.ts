import { convexAdapter } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { internal } from "./_generated/api";
import type { ActionCtx, GenericCtx } from "./_generated/server";
import { betterAuthComponent } from "./auth";
import { betterAuth } from "better-auth";
import { emailOTP, twoFactor } from "better-auth/plugins";
import { getConvexAppUrl } from "@docsurf/utils/envs";

// You'll want to replace this with an environment variable
const siteUrl = getConvexAppUrl();

export const createAuth = (ctx: GenericCtx) =>
   // Configure your Better Auth instance here
   betterAuth({
      // All auth requests will be proxied through your TanStack Start server
      baseURL: siteUrl,
      database: convexAdapter(ctx, betterAuthComponent),
      account: {
         accountLinking: {
            enabled: true,
         },
      },
      // Simple non-verified email/password to get started
      emailAndPassword: {
         enabled: false,
      },
      socialProviders: {
         google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
         },
      },
      user: {
         deleteUser: {
            enabled: true,
         },
      },
      plugins: [
         emailOTP({
            otpLength: 6,
            expiresIn: 10 * 60, // 10  minutes
            allowedAttempts: 3,
            async sendVerificationOTP({ email, otp, type }) {
               if (process.env.NODE_ENV === "development") {
                  console.log("OTP verification email sent to", email, "with code", otp);
                  // return;
               }
               if (type === "sign-in") {
                  // Cast the context to ActionCtx to access runAction
                  const actionCtx = ctx as ActionCtx;
                  await actionCtx.runAction(internal.email_send.sendSignInOTP, {
                     to: email,
                     code: otp,
                  });
               }
            },
         }),
         twoFactor(),
         convex({ jwtExpirationSeconds: 60 * 60 * 24 * 7 }), // 7 days
      ],
   });
