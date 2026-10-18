import "server-only";

import { z } from "zod";

import type { MediaItem } from "@/components/admin/MediaListEditor/MediaListEditor";
import { createClient } from "@/lib/supabase/server";
import { imageUrlSchema, parseRows } from "@/lib/validation/content";

const rowSchema = z.object({
  id: z.string().uuid(),
  url: imageUrlSchema,
  alt: z.string().nullable(),
  caption: z.string().nullable().optional(),
  media_type: z.string().optional(),
  strip: z.string().optional(),
});

function toItem(row: z.infer<typeof rowSchema>): MediaItem {
  return { id: row.id, url: row.url, alt: row.alt ?? "", caption: row.caption ?? "", isVideo: row.media_type === "video" };
}

/** All owner-managed image lists, in display order. */
export async function getAdminMedia() {
  const supabase = await createClient();
  const [hero, strips, gallery] = await Promise.all([
    supabase.from("hero_slides").select("id, url, alt, media_type").order("sort_order"),
    supabase.from("strip_images").select("id, url, alt, strip").order("sort_order"),
    supabase.from("gallery_images").select("id, url, alt, caption").order("sort_order"),
  ]);
  const stripRows = parseRows(rowSchema, strips.data);
  return {
    hero: parseRows(rowSchema, hero.data).map(toItem),
    stripTop: stripRows.filter((r) => r.strip === "top").map(toItem),
    stripBottom: stripRows.filter((r) => r.strip === "bottom").map(toItem),
    gallery: parseRows(rowSchema, gallery.data).map(toItem),
  };
}
