import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cookie-less Supabase client for reading published content on the server.
 * No session, so pages that use it can still be statically rendered and cached.
 */
export function createPublicClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
