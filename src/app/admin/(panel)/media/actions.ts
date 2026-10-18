"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { revalidateSite } from "@/lib/admin/revalidate";
import { storagePathFromUrl } from "@/lib/admin/storage";
import { adminClient, NOT_AUTHORIZED, type AdminActionResult } from "@/lib/auth/admin";
import { altSchema, ownImageUrlSchema, uuid } from "@/lib/validation/admin";

/** The image lists the owner manages, each mapped to its table and limits. */
const LISTS = {
  hero: { table: "hero_slides", max: 10, strip: null },
  stripTop: { table: "strip_images", max: 30, strip: "top" },
  stripBottom: { table: "strip_images", max: 30, strip: "bottom" },
  gallery: { table: "gallery_images", max: 60, strip: null },
} as const;

export type MediaListName = keyof typeof LISTS;
const listSchema = z.enum(["hero", "stripTop", "stripBottom", "gallery"]);

function refresh() {
  revalidateSite();
  revalidatePath("/admin/home");
  revalidatePath("/admin/pages");
}

export async function addMedia(list: string, url: string, alt: string): Promise<AdminActionResult> {
  const name = listSchema.safeParse(list);
  const src = ownImageUrlSchema.safeParse(url);
  const text = altSchema.safeParse(alt);
  if (!name.success || !src.success || !text.success) return { ok: false, message: "קובץ לא תקין" };
  const config = LISTS[name.data];
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;

  let countQuery = supabase.from(config.table).select("sort_order");
  if (config.strip) countQuery = countQuery.eq("strip", config.strip);
  const { data: existing } = await countQuery;
  if ((existing?.length ?? 0) >= config.max) return { ok: false, message: `מותר עד ${config.max} פריטים` };
  const nextOrder = Math.max(-1, ...(existing ?? []).map((r: { sort_order: number }) => r.sort_order)) + 1;

  const row: Record<string, string | number | null> = { url: src.data, alt: text.data || null, sort_order: nextOrder };
  if (config.strip) row.strip = config.strip;
  if (config.table === "hero_slides") row.media_type = /\.(mp4|webm)$/.test(src.data) ? "video" : "image";

  const { error } = await supabase.from(config.table).insert(row);
  if (error) return { ok: false, message: "השמירה נכשלה" };
  refresh();
  return { ok: true };
}

export async function deleteMedia(list: string, itemId: string): Promise<AdminActionResult> {
  const name = listSchema.safeParse(list);
  const id = uuid.safeParse(itemId);
  if (!name.success || !id.success) return { ok: false, message: "בקשה לא תקינה" };
  const { table } = LISTS[name.data];
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { data } = await supabase.from(table).select("url").eq("id", id.data).maybeSingle();
  const { error } = await supabase.from(table).delete().eq("id", id.data);
  if (error) return { ok: false, message: "המחיקה נכשלה" };

  // Remove the file only if no other list still uses the same image.
  const url = z.object({ url: z.string() }).safeParse(data);
  const path = url.success ? storagePathFromUrl(url.data.url) : null;
  if (path && url.success) {
    const uses = await Promise.all(
      ["hero_slides", "strip_images", "gallery_images"].map((t) => supabase.from(t).select("id", { count: "exact", head: true }).eq("url", url.data.url))
    );
    if (uses.every((u) => !u.count)) await supabase.storage.from("media").remove([path]);
  }
  refresh();
  return { ok: true };
}

const orderItemSchema = z.object({ id: uuid, alt: altSchema, caption: z.string().trim().max(200).optional() });

export async function saveMediaOrder(list: string, items: unknown): Promise<AdminActionResult> {
  const name = listSchema.safeParse(list);
  const parsed = z.array(orderItemSchema).max(60).safeParse(items);
  if (!name.success || !parsed.success) return { ok: false, message: "נתונים לא תקינים" };
  const { table } = LISTS[name.data];
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;

  for (const [index, item] of parsed.data.entries()) {
    const values: Record<string, string | number | null> = { sort_order: index, alt: item.alt || null };
    if (table === "gallery_images") values.caption = item.caption || null;
    const { error } = await supabase.from(table).update(values).eq("id", item.id);
    if (error) return { ok: false, message: "השמירה נכשלה" };
  }
  refresh();
  return { ok: true, message: "נשמר" };
}
