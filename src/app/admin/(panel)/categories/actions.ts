"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { revalidateSite } from "@/lib/admin/revalidate";
import { slugify } from "@/lib/admin/slug";
import { adminClient, NOT_AUTHORIZED, type AdminActionResult } from "@/lib/auth/admin";
import { checkbox, ownImageUrlSchema, uuid } from "@/lib/validation/admin";

const categorySchema = z.object({
  name: z.string().trim().min(1, "נא למלא שם").max(80),
  slug: z.string().trim().max(100),
  description: z.string().trim().max(1000),
  imageUrl: z.union([z.literal(""), ownImageUrlSchema]),
  sortOrder: z.coerce.number().int().min(0).max(10000),
  isActive: checkbox,
});

function read(formData: FormData) {
  return categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") ?? "",
    description: formData.get("description") ?? "",
    imageUrl: formData.get("imageUrl") ?? "",
    sortOrder: formData.get("sortOrder") || 0,
    isActive: formData.get("isActive"),
  });
}

function refresh() {
  revalidateSite();
  revalidatePath("/admin/categories");
}

export async function createCategory(_prev: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> {
  const parsed = read(formData);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;
  const d = parsed.data;
  const slug = slugify(d.slug || d.name) || crypto.randomUUID().slice(0, 8);
  const { error } = await supabase.from("categories").insert({
    name: d.name,
    slug,
    description: d.description || null,
    image_url: d.imageUrl || null,
    sort_order: d.sortOrder,
    is_active: true,
  });
  if (error) return { ok: false, message: error.code === "23505" ? "כבר קיימת קטגוריה עם הכתובת הזו" : "השמירה נכשלה" };
  refresh();
  return { ok: true, message: "הקטגוריה נוספה" };
}

export async function updateCategory(categoryId: string, _prev: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> {
  const id = uuid.safeParse(categoryId);
  const parsed = read(formData);
  if (!id.success || !parsed.success) return { ok: false, message: parsed.error?.issues[0]?.message ?? "נתונים לא תקינים" };
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;
  const d = parsed.data;
  const { error } = await supabase
    .from("categories")
    .update({
      name: d.name,
      slug: slugify(d.slug || d.name),
      description: d.description || null,
      image_url: d.imageUrl || null,
      sort_order: d.sortOrder,
      is_active: d.isActive,
    })
    .eq("id", id.data);
  if (error) return { ok: false, message: error.code === "23505" ? "כבר קיימת קטגוריה עם הכתובת הזו" : "השמירה נכשלה" };
  refresh();
  return { ok: true };
}

export async function deleteCategory(categoryId: string): Promise<AdminActionResult> {
  const id = uuid.safeParse(categoryId);
  if (!id.success) return { ok: false, message: "בקשה לא תקינה" };
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;
  const { error } = await supabase.from("categories").delete().eq("id", id.data);
  if (error) return { ok: false, message: "המחיקה נכשלה" };
  refresh();
  return { ok: true };
}
