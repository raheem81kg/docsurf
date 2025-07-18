import "./polyfills";
import { render } from "@react-email/components";
import { Resend as ResendConvex } from "@convex-dev/resend";
import { components } from "./_generated/api";
import VerifyEmail from "@docsurf/email/emails/verifyEmail";
import VerifyOTP from "@docsurf/email/emails/verifyOTP";
import MagicLinkEmail from "@docsurf/email/emails/magicLink";
import SignInOTP from "@docsurf/email/emails/signInOTP";
import WelcomeEmail from "@docsurf/email/emails/welcome";
import GetStartedEmail from "@docsurf/email/emails/get-started";
import type { ActionCtx } from "./_generated/server";

const resend: ResendConvex = new ResendConvex(components.resend, {
   testMode: false,
});

export const sendEmail = async (
   ctx: ActionCtx,
   {
      to,
      subject,
      html,
   }: {
      to: string;
      subject: string;
      html: string;
   }
) => {
   const from = process.env.EMAIL_FROM || "noreply@mail.docsurf.ai";
   await resend.sendEmail(ctx, {
      from: `Docsurf <${from}>`,
      to,
      subject,
      html,
   });
};

export const sendEmailVerification = async (
   ctx: ActionCtx,
   {
      to,
      url,
   }: {
      to: string;
      url: string;
   }
) => {
   await sendEmail(ctx, {
      to,
      subject: "Verify your email address",
      html: await render(<VerifyEmail url={url} />),
   });
};

export const sendOTPVerification = async (ctx: ActionCtx, { to, code }: { to: string; code: string }) => {
   await sendEmail(ctx, {
      to,
      subject: "Verify your email address - Docsurf",
      html: await render(<VerifyOTP code={code} />),
   });
};

export const sendMagicLink = async (ctx: ActionCtx, { to, url }: { to: string; url: string }) => {
   await sendEmail(ctx, {
      to,
      subject: "Sign in to your account - Docsurf",
      html: await render(<MagicLinkEmail url={url} />),
   });
};

export const sendSignInOTP = async (ctx: ActionCtx, { to, code }: { to: string; code: string }) => {
   await sendEmail(ctx, {
      to,
      subject: "Sign in to your account - Docsurf",
      html: await render(<SignInOTP code={code} />),
   });
};

export const sendWelcomeEmail = async (ctx: ActionCtx, { to, fullName }: { to: string; fullName: string }) => {
   await sendEmail(ctx, {
      to,
      subject: "Welcome to Docsurf",
      html: await render(<WelcomeEmail fullName={fullName} />),
   });
};

export const sendGetStartedEmail = async (ctx: ActionCtx, { to, fullName }: { to: string; fullName: string }) => {
   await sendEmail(ctx, {
      to,
      subject: "Get started with Docsurf",
      html: await render(<GetStartedEmail fullName={fullName} />),
   });
};
