import "./polyfills";
import { render } from "@react-email/components";
import { Resend } from "resend";
import VerifyEmail from "@docsurf/email/emails/verifyEmail";
import VerifyOTP from "@docsurf/email/emails/verifyOTP";
import MagicLinkEmail from "@docsurf/email/emails/magicLink";
import SignInOTP from "@docsurf/email/emails/signInOTP";
import WelcomeEmail from "@docsurf/email/emails/welcome";
import GetStartedEmail from "@docsurf/email/emails/get-started";

const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
   const resend = new Resend(process.env.RESEND_API_KEY);
   const from = process.env.EMAIL_FROM || "noreply@mail.docsurf.ai";
   await resend.emails.send({
      from: `Docsurf <${from}>`,
      to: [to],
      subject,
      html,
   });
};

export const sendEmailVerification = async ({ to, url }: { to: string; url: string }) => {
   await sendEmail({
      to,
      subject: "Verify your email address - Docsurf",
      html: await render(<VerifyEmail url={url} />),
   });
};

export const sendOTPVerification = async ({ to, code }: { to: string; code: string }) => {
   await sendEmail({
      to,
      subject: "Verify your email address - Docsurf",
      html: await render(<VerifyOTP code={code} />),
   });
};

export const sendMagicLink = async ({ to, url }: { to: string; url: string }) => {
   await sendEmail({
      to,
      subject: "Sign in to your account - Docsurf",
      html: await render(<MagicLinkEmail url={url} />),
   });
};

export const sendSignInOTP = async ({ to, code }: { to: string; code: string }) => {
   await sendEmail({
      to,
      subject: "Sign in to your account - Docsurf",
      html: await render(<SignInOTP code={code} />),
   });
};

export const sendWelcomeEmail = async ({ to, fullName }: { to: string; fullName: string }) => {
   await sendEmail({
      to,
      subject: "Welcome to Docsurf",
      html: await render(<WelcomeEmail fullName={fullName} />),
   });
};

export const sendGetStartedEmail = async ({ to, fullName }: { to: string; fullName: string }) => {
   await sendEmail({
      to,
      subject: "Get started with Docsurf",
      html: await render(<GetStartedEmail fullName={fullName} />),
   });
};
