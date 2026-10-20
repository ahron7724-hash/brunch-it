"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { revalidateSite } from "@/lib/admin/revalidate";
import { slugify } from "@/lib/admin/slug";
import { storagePathFromUrl } from "@/lib/admin/storage";
import { adminClient, NOT_AUTHORIZED, type AdminActionResult } from "@/lib/auth/admin";
import { jsonField, trayDetailsSchema, trayImagesSchema, trayItemsSchema, traySizesSchema, uuid } from "@/lib/validation/admin";

type Supabase = NonNullable<Awaited<ReturnType<typeof adminClient>>>;
type RowValues = Record<string, string | number | boolean | null>;

function refresh(trayId?: string) {
  revalidateSite();
  revalidatePath("/admin/trays");
  if (trayId) revalidatePath(`/admin/trays/${trayId}`);
}

/** Picks a free slug: base, base-2, base-3… */
async function uniqueSlug(supabase: Supabase, base: string, exceptId?: string): Promise<string> {
  const root = base || "מגש";
  for (let n = 1; n < 50; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    let query = supabase.from("trays").select("id").eq("slug", candidate);
    if (exceptId) query = query.neq("id", exceptId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
  }
  return `${root}-${crypto.randomUUID().slice(0, 8)}`;
}

/** Makes a tray's child rows match the submitted list: delete dropped, update kept, insert new. */
async function syncChildren(supabase: Supabase, table: "tray_sizes" | "tray_items" | "tray_images", trayId: string, rows: { id?: string; values: RowValues }[]) {
  const { data, error } = await supabase.from(table).select("id").eq("tray_id", trayId);
  if (error) return false;
  const existing = (data ?? []).map((r: { id: string }) => r.id);
  const keep = new Set(rows.flatMap((r) => (r.id ? [r.id] : [])));
  const drop = existing.filter((rowId) => !keep.has(rowId));
  if (drop.length > 0) {
    const { error: deleteError } = await supabase.from(table).delete().eq("tray_id", trayId).in("id", drop);
    if (deleteError) return false;
  }
  for (const row of rows) {
    const { error: rowError } =
      row.id && existing.includes(row.id)
        ? await supabase.from(table).update(row.values).eq("id", row.id).eq("tray_id", trayId)
        : await supabase.from(table).insert({ ...row.values, tray_id: trayId });
    if (rowError) return false;
  }
  return true;
}

/** Every image a tray uses (its own, its hero images and its items'). */
async function trayImageUrls(supabase: Supabase, trayId: string): Promise<string[]> {
  const { data } = await supabase.from("trays").select("image_url, tray_images(url), tray_items(image_url)").eq("id", trayId).maybeSingle();
  const row = z
    .object({
      image_url: z.string().nullable(),
      tray_images: z.array(z.object({ url: z.string() })),
      tray_items: z.array(z.object({ image_url: z.string().nullable() })),
    })
    .safeParse(data);
  if (!row.success) return [];
  return [row.data.image_url, ...row.data.tray_images.map((i) => i.url), ...row.data.tray_items.map((i) => i.image_url)].flatMap((url) => (url ? [url] : []));
}

/** Deletes uploaded files from storage (ignores demo images and anything not in our bucket). */
async function removeStoredFiles(supabase: Supabase, urls: string[]) {
  const paths = urls.flatMap((url) => {
    const path = storagePathFromUrl(url);
    return path ? [path] : [];
  });
  if (paths.length > 0) await supabase.storage.from("media").remove(paths);
}

export async function createTray(_prev: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> {
  const title = z.string().trim().min(1, "נא למלא שם למגש").max(120).safeParse(formData.get("title"));
  if (!title.success) return { ok: false, message: title.error.issues[0]?.message ?? "שם לא תקין" };
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const slug = await uniqueSlug(supabase, slugify(title.data));
  const { data, error } = await supabase.from("trays").insert({ title: title.data, slug, is_active: false }).select("id").single();
  if (error || !data) return { ok: false, message: "לא הצלחנו ליצור את המגש" };
  refresh();
  redirect(`/admin/trays/${z.object({ id: z.string() }).parse(data).id}`);
}

/** Saves the whole tray page at once: details, sizes and items. */
export async function saveTray(trayId: string, _prev: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> {
  const id = uuid.safeParse(trayId);
  if (!id.success) return { ok: false, message: "בקשה לא תקינה" };

  const details = trayDetailsSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug") ?? "",
    description: formData.get("description") ?? "",
    imageUrl: formData.get("imageUrl") ?? "",
    leadTimeHours: formData.get("leadTimeHours"),
    isActive: formData.get("isActive"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!details.success) return { ok: false, message: `פרטי המגש: ${details.error.issues[0]?.message ?? "נתונים לא תקינים"}` };
  const sizes = traySizesSchema.safeParse(jsonField(formData.get("sizes")));
  if (!sizes.success) return { ok: false, message: `גדלי מגש: ${sizes.error.issues[0]?.message ?? "נתונים לא תקינים"}` };
  const items = trayItemsSchema.safeParse(jsonField(formData.get("items")));
  if (!items.success) return { ok: false, message: `פריטים: ${items.error.issues[0]?.message ?? "נתונים לא תקינים"}` };
  const images = trayImagesSchema.safeParse(jsonField(formData.get("images")));
  if (!images.success) return { ok: false, message: `תמונות לראש הדף: ${images.error.issues[0]?.message ?? "נתונים לא תקינים"}` };
  const d = details.data;
  if (d.isActive && (sizes.data.length === 0 || !items.data.some((i) => i.isActive))) {
    return { ok: false, message: "כדי להציג את המגש באתר צריך לפחות גודל אחד ופריט פעיל אחד (או לבטל את הסימון \"מוצג באתר\")." };
  }

  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;
  const before = await trayImageUrls(supabase, id.data);

  const slug = await uniqueSlug(supabase, d.slug || slugify(d.title), id.data);
  const { error } = await supabase
    .from("trays")
    .update({
      title: d.title,
      slug,
      description: d.description,
      image_url: d.imageUrl || null,
      min_lead_time_hours: d.leadTimeHours,
      is_active: d.isActive,
      sort_order: d.sortOrder,
    })
    .eq("id", id.data);
  if (error) return { ok: false, message: "שמירת הפרטים נכשלה" };

  const sizesSaved = await syncChildren(
    supabase,
    "tray_sizes",
    id.data,
    sizes.data.map((s, i) => ({ id: s.id, values: { label: s.label, capacity: s.capacity, sort_order: i } }))
  );
  if (!sizesSaved) return { ok: false, message: "שמירת הגדלים נכשלה" };

  const itemsSaved = await syncChildren(
    supabase,
    "tray_items",
    id.data,
    items.data.map((item, i) => ({
      id: item.id,
      values: { name: item.name, price: item.price, image_url: item.imageUrl || null, is_active: item.isActive, sort_order: i },
    }))
  );
  if (!itemsSaved) return { ok: false, message: "שמירת הפריטים נכשלה" };

  const imagesSaved = await syncChildren(
    supabase,
    "tray_images",
    id.data,
    images.data.map((img, i) => ({ id: img.id, values: { url: img.url, alt: img.alt || null, sort_order: i } }))
  );
  if (!imagesSaved) return { ok: false, message: "שמירת התמונות נכשלה" };

  const after = new Set(await trayImageUrls(supabase, id.data));
  await removeStoredFiles(supabase, before.filter((url) => !after.has(url)));

  refresh(id.data);
  return { ok: true, message: d.isActive ? "המגש נשמר ומוצג באתר" : "המגש נשמר (מוסתר מהאתר)" };
}

export async function deleteTray(trayId: string): Promise<AdminActionResult> {
  const id = uuid.safeParse(trayId);
  if (!id.success) return { ok: false, message: "בקשה לא תקינה" };
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const urls = await trayImageUrls(supabase, id.data);
  const { error } = await supabase.from("trays").delete().eq("id", id.data);
  if (error) return { ok: false, message: "המחיקה נכשלה" };
  await removeStoredFiles(supabase, urls);

  refresh();
  redirect("/admin/trays");
}
