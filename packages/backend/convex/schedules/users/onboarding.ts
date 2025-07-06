import { internalAction } from "../../_generated/server";
import { ConvexError } from "convex/values";
import { v } from "convex/values";
import { Resend } from "resend";
import { sendWelcomeEmail, sendGetStartedEmail } from "../../email";
import { internal } from "../../_generated/api";

/**
 * Scheduled task to send welcome email to a new user.
 * This includes adding them to the email list and sending a welcome email.
 * Runs 5 seconds after user signup.
 */
export const sendWelcomeEmailTask = internalAction({
   args: { userId: v.id("users") },
   handler: async (ctx, { userId }) => {
      // Get user data from Convex database using internal query
      const user = await ctx.runQuery(internal.users.getUserInternal, { userId });
      if (!user || !user.name || !user.email) {
         throw new ConvexError({
            code: "user_not_found",
            message: "User data is missing",
            statusCode: 404,
         });
      }

      const [firstName, ...rest] = user.name.split(" ");
      const lastName = rest.join(" ");

      // Add user to Resend audience
      if (process.env.RESEND_API_KEY && process.env.RESEND_AUDIENCE_ID) {
         try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.contacts.create({
               email: user.email,
               firstName,
               lastName,
               unsubscribed: false,
               audienceId: process.env.RESEND_AUDIENCE_ID,
            });
         } catch (error) {
            console.error("Failed to add user to Resend audience:", error);
            // Don't throw - continue with email sending
         }
      }

      // Send welcome email
      try {
         await sendWelcomeEmail({
            to: user.email,
            fullName: user.name,
         });
      } catch (error) {
         console.error("Failed to send welcome email:", error);
         throw new ConvexError({
            code: "email_send_failed",
            message: "Failed to send welcome email",
            statusCode: 500,
         });
      }

      return { success: true, emailType: "welcome" };
   },
});

/**
 * Scheduled task to send get started email to a new user.
 * Runs 3 days after user signup to encourage engagement.
 */
export const sendGetStartedEmailTask = internalAction({
   args: { userId: v.id("users") },
   handler: async (ctx, { userId }) => {
      // Get user data from Convex database using internal query
      const user = await ctx.runQuery(internal.users.getUserInternal, { userId });
      if (!user || !user.name || !user.email) {
         throw new ConvexError({
            code: "user_not_found",
            message: "User data is missing",
            statusCode: 404,
         });
      }

      // Send get started email
      try {
         await sendGetStartedEmail({
            to: user.email,
            fullName: user.name,
         });
      } catch (error) {
         console.error("Failed to send get started email:", error);
         throw new ConvexError({
            code: "email_send_failed",
            message: "Failed to send get started email",
            statusCode: 500,
         });
      }

      return { success: true, emailType: "get_started" };
   },
});
