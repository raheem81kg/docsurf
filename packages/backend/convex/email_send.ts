"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { render } from "@react-email/components";
import { components } from "./_generated/api";
import SignInOTP from "@docsurf/email/emails/signInOTP";
import "./polyfills";
import { sendEmail } from "./email";

export const sendSignInOTP = internalAction({
   args: { to: v.string(), code: v.string() },
   handler: async (ctx, { to, code }) => {
      await sendEmail(ctx, {
         to,
         subject: "Sign in to your account - Docsurf",
         html: await render(SignInOTP({ code })),
      });
   },
});
