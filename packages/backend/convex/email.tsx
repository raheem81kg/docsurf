import "./polyfills";
import { render } from "@react-email/components";
import React from "react";
import { Resend } from "resend";
import MagicLinkEmail from "./emails/magicLink";
import VerifyEmail from "./emails/verifyEmail";
import VerifyOTP from "./emails/verifyOTP";

const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
   const resend = new Resend(process.env.RESEND_API_KEY);
   await resend.emails.send({
      from: "Test <onboarding@boboddy.business>",
      to: [to],
      subject,
      html,
   });
};

export const sendEmailVerification = async ({ to, url }: { to: string; url: string }) => {
   await sendEmail({
      to,
      subject: "Verify your email address",
      html: await render(<VerifyEmail url={url} />),
   });
};

export const sendOTPVerification = async ({ to, code }: { to: string; code: string }) => {
   await sendEmail({
      to,
      subject: "Verify your email address",
      html: await render(<VerifyOTP code={code} />),
   });
};

export const sendMagicLink = async ({ to, url }: { to: string; url: string }) => {
   await sendEmail({
      to,
      subject: "Sign in to your account",
      html: await render(<MagicLinkEmail url={url} />),
   });
};
