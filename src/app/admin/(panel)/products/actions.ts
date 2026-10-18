"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { revalidateSite } from "@/lib/admin/revalidate";
import { slugify } from "@/lib/admin/slug";
import { storagePathFromUrl } from "@/lib/admin/storage";
import { adminClient, NOT_AUTHORIZED, type AdminActionResult } from "@/lib/auth/admin";
import { jsonField, optionsSchema, productDetailsSchema, productImagesSchema, sizesSchema, uuid } from "@/lib/validation/admin";

type Supabase = NonNullable<Awaited<ReturnType<typeof adminClient>>>;
type ChildTable = "product_sizes" | "product_options" | "product_images";
type RowValues = Record<string, string | number | boolean | null>;

function refresh(productId?: string) {
  revalidateSite();
  revalidatePath("/admin/products");
  if (productId) revalidatePath(`/admin/products/${productId}`);
}

/** Picks a free slug: base, base-2, base-3… */
async function uniqueSlug(supabase: Supabase, base: string, exceptId?: string): Promise<string> {
  const root = base || "מוצר";
  for (let n = 1; n < 50; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    let query = supabase.from("products").select("id").eq("slug", candidate);
    if (exceptId) query = query.neq("id", exceptId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
  }
  return `${root}-${crypto.randomUUID().slice(0, 8)}`;
}

/** Makes a product's child rows match the submitted list: delete dropped, update kept, insert new. */
async function syncChildren(supabase: Supabase, table: ChildTable, productId: string, rows: { id?: string; values: RowValues }[]) {
  const { data, error } = await supabase.from(table).select("id").eq("product_id", productId);
  if (error) return { ok: false as const, removedUrls: [] as string[] };
  const existing = (data ?? []).map((r: { id: string }) => r.id);
  const keep = new Set(rows.flatMap((r) => (r.id ? [r.id] : [])));
  const drop = existing.filter((rowId) => !keep.has(rowId));

  let removedUrls: string[] = [];
  if (drop.length > 0) {
    if (table === "product_images") {
      const { data: urls } = await supabase.from("product_images").select("url").in("id", drop);
      removedUrls = (urls ?? []).map((u: { url: string }) => u.url);
    }
    // Deletes first, so the 3-per-product limit never trips mid-save.
    const { error: deleteError } = await supabase.from(table).delete().eq("product_id", productId).in("id", drop);
    if (deleteError) return { ok: false as const, removedUrls: [] };
  }

  for (const row of rows) {
    const { error: rowError } =
      row.id && existing.includes(row.id)
        ? await supabase.from(table).update(row.values).eq("id", row.id).eq("product_id", productId)
        : await supabase.from(table).insert({ ...row.values, product_id: productId });
    if (rowError) return { ok: false as const, removedUrls };
  }
  return { ok: true as const, removedUrls };
}

export async function createProduct(_prev: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> {
  const title = z.string().trim().min(1, "נא למלא שם מוצר").max(120).safeParse(formData.get("title"));
  if (!title.success) return { ok: false, message: title.error.issues[0]?.message ?? "שם לא תקין" };
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const slug = await uniqueSlug(supabase, slugify(title.data));
  const { data, error } = await supabase.from("products").insert({ title: title.data, slug, is_active: false }).select("id").single();
  if (error || !data) return { ok: false, message: "לא הצלחנו ליצור את המוצר" };
  refresh();
  redirect(`/admin/products/${z.object({ id: z.string() }).parse(data).id}`);
}

/** Saves everything on the product page at once: details, categories, sizes, flavors and images. */
export async function saveProduct(productId: string, _prev: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> {
  const id = uuid.safeParse(productId);
  if (!id.success) return { ok: false, message: "בקשה לא תקינה" };

  // Validate every section before writing anything.
  const details = productDetailsSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug") ?? "",
    description: formData.get("description") ?? "",
    contents: formData.get("contents") ?? "",
    leadTimeHours: formData.get("leadTimeHours"),
    dietTags: formData.getAll("dietTags"),
    categoryIds: formData.getAll("categoryIds"),
    allowsCustomText: formData.get("allowsCustomText"),
    customTextLabel: formData.get("customTextLabel") ?? "",
    isActive: formData.get("isActive"),
    isFeatured: formData.get("isFeatured"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!details.success) return { ok: false, message: `פרטי המוצר: ${details.error.issues[0]?.message ?? "נתונים לא תקינים"}` };
  const sizes = sizesSchema.safeParse(jsonField(formData.get("sizes")));
  if (!sizes.success) return { ok: false, message: `גדלים ומחירים: ${sizes.error.issues[0]?.message ?? "נתונים לא תקינים"}` };
  const options = optionsSchema.safeParse(jsonField(formData.get("options")));
  if (!options.success) return { ok: false, message: `טעמים ותוספות: ${options.error.issues[0]?.message ?? "נתונים לא תקינים"}` };
  const images = productImagesSchema.safeParse(jsonField(formData.get("images")));
  if (!images.success) return { ok: false, message: `תמונות: ${images.error.issues[0]?.message ?? "נתונים לא תקינים"}` };
  const d = details.data;
  if (d.isActive && sizes.data.length === 0) {
    return { ok: false, message: "כדי להציג את המוצר באתר צריך לפחות גודל אחד עם מחיר (או לבטל את הסימון \"מוצג באתר\")." };
  }

  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const slug = await uniqueSlug(supabase, d.slug || slugify(d.title), id.data);
  const { error } = await supabase
    .from("products")
    .update({
      title: d.title,
      slug,
      description: d.description,
      contents: d.contents,
      min_lead_time_hours: d.leadTimeHours,
      diet_tags: d.dietTags,
      allows_custom_text: d.allowsCustomText,
      custom_text_label: d.customTextLabel,
      is_active: d.isActive,
      is_featured: d.isFeatured,
      sort_order: d.sortOrder,
    })
    .eq("id", id.data);
  if (error) return { ok: false, message: "שמירת הפרטים נכשלה" };

  await supabase.from("product_categories").delete().eq("product_id", id.data);
  if (d.categoryIds.length > 0) {
    const { error: linkError } = await supabase
      .from("product_categories")
      .insert(d.categoryIds.map((categoryId) => ({ product_id: id.data, category_id: categoryId })));
    if (linkError) return { ok: false, message: "שמירת הקטגוריות נכשלה" };
  }

  const sizeResult = await syncChildren(
    supabase,
    "product_sizes",
    id.data,
    sizes.data.map((s, i) => ({ id: s.id, values: { label: s.label, price: s.price, unit_count: s.unitCount, serves: s.serves, sort_order: i } }))
  );
  if (!sizeResult.ok) return { ok: false, message: "שמירת הגדלים נכשלה" };

  const optionResult = await syncChildren(
    supabase,
    "product_options",
    id.data,
    options.data.map((o, i) => ({ id: o.id, values: { group_name: o.groupName, label: o.label, extra_price: o.extraPrice, sort_order: i, is_active: true } }))
  );
  if (!optionResult.ok) return { ok: false, message: "שמירת הטעמים נכשלה" };

  const imageResult = await syncChildren(
    supabase,
    "product_images",
    id.data,
    images.data.map((img, i) => ({ id: img.id, values: { url: img.url, alt: img.alt || null, sort_order: i } }))
  );
  if (!imageResult.ok) return { ok: false, message: "שמירת התמונות נכשלה" };
  await removeStoredFiles(supabase, imageResult.removedUrls);

  refresh(id.data);
  return { ok: true, message: d.isActive ? "המוצר נשמר ומוצג באתר" : "המוצר נשמר (מוסתר מהאתר)" };
}

/** Shows or hides a product on the site (from the product list). */
export async function setProductActive(productId: string, active: boolean): Promise<AdminActionResult> {
  const id = uuid.safeParse(productId);
  const show = z.boolean().safeParse(active);
  if (!id.success || !show.success) return { ok: false, message: "בקשה לא תקינה" };
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;

  if (show.data) {
    const { count } = await supabase.from("product_sizes").select("id", { count: "exact", head: true }).eq("product_id", id.data);
    if (!count) return { ok: false, message: "אי אפשר להציג: אין למוצר גודל עם מחיר" };
  }
  const { error } = await supabase.from("products").update({ is_active: show.data }).eq("id", id.data);
  if (error) return { ok: false, message: "העדכון נכשל" };
  refresh(id.data);
  return { ok: true, message: show.data ? "המוצר מוצג באתר" : "המוצר הוסתר מהאתר" };
}

export async function deleteProduct(productId: string): Promise<AdminActionResult> {
  const id = uuid.safeParse(productId);
  if (!id.success) return { ok: false, message: "בקשה לא תקינה" };
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { data: images } = await supabase.from("product_images").select("url").eq("product_id", id.data);
  const { error } = await supabase.from("products").delete().eq("id", id.data);
  if (error) return { ok: false, message: "המחיקה נכשלה" };
  await removeStoredFiles(supabase, (images ?? []).map((img: { url: string }) => img.url));

  refresh();
  redirect("/admin/products");
}

/** Deletes uploaded files from storage (ignores demo images and anything not in our bucket). */
async function removeStoredFiles(supabase: Supabase, urls: string[]) {
  const paths = urls.flatMap((url) => {
    const path = storagePathFromUrl(url);
    return path ? [path] : [];
  });
  if (paths.length > 0) await supabase.storage.from("media").remove(paths);
}
