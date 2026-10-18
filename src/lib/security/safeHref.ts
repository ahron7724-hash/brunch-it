import { z } from "zod";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const inputSchema = z.string().trim().min(1).max(2048);

/** Returns a safe URL or null. Blocks javascript:, data:, vbscript: and similar. */
export function safeHref(input: unknown): string | null {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return null;
  const value = parsed.data;

  if (value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) {
    return value; // internal path
  }
  try {
    const url = new URL(value);
    return ALLOWED_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

/** For post-login redirects: internal paths only (prevents open redirects). */
export function safeRedirect(input: unknown, fallback = "/"): string {
  const href = safeHref(input);
  return href !== null && href.startsWith("/") ? href : fallback;
}

/** Builds a tel: link from a phone number, keeping only digits and a leading +. */
export function telHref(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, "");
  return /^\+?\d{7,15}$/.test(digits) ? `tel:${digits}` : null;
}

/** Builds a mailto: link from a validated email address. */
export function mailtoHref(email: string): string | null {
  const parsed = z.string().trim().email().max(254).safeParse(email);
  return parsed.success ? `mailto:${parsed.data}` : null;
}
