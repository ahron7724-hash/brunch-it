import "server-only";

import { cache } from "react";

import { createPublicClient } from "@/lib/supabase/public";
import { siteSettingsSchema } from "@/lib/validation/settings";

import { DEFAULT_SETTINGS, type SiteSettings } from "./defaults";

/**
 * Reads the single `site_settings` row and validates it field by field,
 * so a partially filled row (or no row at all) still yields a complete, safe object.
 */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = createPublicClient();
  if (!supabase) {
    return DEFAULT_SETTINGS;
  }

  const { data, error } = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();

  if (error || !data) {
    return DEFAULT_SETTINGS;
  }

  const parsed = siteSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, ...asObject(data.data) });
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
});

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? { ...value } : {};
}
