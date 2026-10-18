"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type LoginState = { ok: boolean; message?: string; error?: string };

const emailSchema = z.string().trim().toLowerCase().email("כתובת דוא״ל לא תקינה").max(254);

/** Sends a one-time sign-in link. The reply is identical whether or not the address is an admin. */
export async function sendLoginLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      shouldCreateUser: false, // only existing (admin) users can sign in
      emailRedirectTo: new URL("/admin/auth/callback", siteUrl).href,
    },
  });

  if (error && error.status === 429) {
    return { ok: false, error: "נשלחו יותר מדי בקשות. נסו שוב בעוד כמה דקות." };
  }
  return { ok: true, message: "אם הכתובת רשומה כמנהלת, נשלח אליה קישור כניסה. בדקו את תיבת הדואר (וגם את תיקיית הספאם)." };
}
