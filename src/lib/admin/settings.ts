import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { SiteSettings } from "@/lib/settings/defaults";

/** Merges validated fields into the single site_settings row (other fields are kept as they are). */
export async function saveSettingsPatch(supabase: SupabaseClient, patch: Partial<SiteSettings>): Promise<boolean> {
  const { data, error } = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
  if (error) return false;
  const current = data && typeof data.data === "object" && data.data !== null && !Array.isArray(data.data) ? data.data : {};
  const next = { ...current, ...patch, ...(patch.colors ? { colors: { ...(current.colors ?? {}), ...patch.colors } } : {}) };
  const { error: saveError } = await supabase.from("site_settings").upsert({ id: 1, data: next });
  return !saveError;
}
