import "./polyfills";
import { render } from "@react-email/components";
import React from "react";
import { Resend } from "resend";
import MagicLinkEmail from "./emails/magicLink";
import VerifyEmail from "./emails/verifyEmail";
import VerifyOTP from "./emails/verifyOTP";
import SignInOTP from "./emails/signInOTP";

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
