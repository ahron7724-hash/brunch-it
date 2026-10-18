import "server-only";

import nodemailer from "nodemailer";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type SendResult = { ok: true } | { ok: false; reason: string };

/**
 * Email adapter. EMAIL_PROVIDER=gmail (default, until the site has its own domain)
 * or EMAIL_PROVIDER=resend (after the domain is verified in Resend).
 */
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const provider = process.env.EMAIL_PROVIDER === "resend" ? "resend" : "gmail";
  try {
    return provider === "resend" ? await sendWithResend(message) : await sendWithGmail(message);
  } catch (error) {
    console.error("email send failed", provider, error instanceof Error ? error.name : "unknown");
    return { ok: false, reason: "send-failed" };
  }
}

async function sendWithGmail(message: EmailMessage): Promise<SendResult> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return { ok: false, reason: "gmail-not-configured" };

  const transport = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  await transport.sendMail({
    from: process.env.EMAIL_FROM || user,
    to: message.to,
    replyTo: message.replyTo,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
  return { ok: true };
}

async function sendWithResend(message: EmailMessage): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return { ok: false, reason: "resend-not-configured" };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [message.to],
      reply_to: message.replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });
  return response.ok ? { ok: true } : { ok: false, reason: `resend-${response.status}` };
}
