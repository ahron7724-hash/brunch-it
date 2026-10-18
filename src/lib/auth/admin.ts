import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in admin, or null. Uses getUser() (verified with Supabase), never getSession(),
 * and confirms membership in admin_users (readable only by admins under RLS).
 */
export const getAdminUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from("admin_users").select("id").eq("id", user.id).maybeSingle();
  return error || !data ? null : user;
});

/** For admin pages: sends anyone who isn't an admin to the login page. */
export async function requireAdminPage(): Promise<User> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

export type AdminActionResult =
  | { ok: true; message?: string; /** Saved row ids, in the submitted order (list editors). */ ids?: string[] }
  | { ok: false; message: string };

export const NOT_AUTHORIZED: AdminActionResult = { ok: false, message: "אין הרשאה. נא להתחבר מחדש." };

/** For admin Server Actions (public endpoints): returns the admin client, or null when not authorized. */
export async function adminClient() {
  const user = await getAdminUser();
  if (!user) return null;
  return createClient();
}
