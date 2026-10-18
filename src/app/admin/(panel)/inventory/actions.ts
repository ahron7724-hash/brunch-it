"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { adminClient, NOT_AUTHORIZED, type AdminActionResult } from "@/lib/auth/admin";
import { TRACKING, UNITS } from "@/lib/inventory/calc";
import { uuid } from "@/lib/validation/admin";

const amount = z.coerce.number().min(0, "כמות לא יכולה להיות שלילית").max(10_000_000);

const materialSchema = z.object({
  id: uuid.optional(),
  name: z.string().trim().min(1, "לכל חומר גלם צריך שם").max(80),
  unit: z.enum(UNITS, "יחידה לא תקינה"),
  tracking: z.enum(TRACKING, "סוג מעקב לא תקין"),
  minStockAlert: z.preprocess((v) => (v === "" ? 0 : v), amount),
  categoryId: z.preprocess((v) => (v === "" ? null : v), uuid.nullable().optional()),
});

function refresh() {
  revalidatePath("/admin/inventory", "layout");
  revalidatePath("/admin/production");
}

/** Saves the raw materials list: delete dropped, update kept, insert new. */
export async function saveMaterials(rows: unknown): Promise<AdminActionResult> {
  const parsed = z.array(materialSchema).max(500).safeParse(rows);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  const names = parsed.data.map((m) => m.name);
  if (new Set(names).size !== names.length) return { ok: false, message: "יש שני חומרי גלם עם אותו שם" };

  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { data: existing, error: readError } = await supabase.from("raw_materials").select("id");
  if (readError) return { ok: false, message: "השמירה נכשלה" };
  const keep = new Set(parsed.data.flatMap((m) => (m.id ? [m.id] : [])));
  const drop = (existing ?? []).map((r: { id: string }) => r.id).filter((id) => !keep.has(id));
  if (drop.length > 0) {
    const { error } = await supabase.from("raw_materials").delete().in("id", drop);
    // 23503: still used in a recipe (foreign key).
    if (error) return { ok: false, message: error.code === "23503" ? "אי אפשר למחוק חומר גלם שמופיע במתכון. קודם צריך להסיר אותו מהמתכונים." : "השמירה נכשלה" };
  }

  const ids: string[] = [];
  for (const m of parsed.data) {
    const values = { name: m.name, unit: m.unit, tracking: m.tracking, min_stock_alert: m.minStockAlert, category_id: m.categoryId ?? null };
    if (m.id) {
      const { error } = await supabase.from("raw_materials").update(values).eq("id", m.id);
      if (error) return { ok: false, message: error.code === "23505" ? `השם "${m.name}" כבר קיים` : "השמירה נכשלה" };
      ids.push(m.id);
    } else {
      const { data, error } = await supabase.from("raw_materials").insert(values).select("id").single();
      if (error || !data) return { ok: false, message: error?.code === "23505" ? `השם "${m.name}" כבר קיים` : "השמירה נכשלה" };
      ids.push(z.object({ id: z.string() }).parse(data).id);
    }
  }
  refresh();
  return { ok: true, message: "חומרי הגלם נשמרו", ids };
}

const categorySchema = z.object({
  id: uuid.optional(),
  name: z.string().trim().min(1, "לכל קטגוריה צריך שם").max(60),
});

/** Saves the material categories in the order shown. Materials of a removed category stay, without a category. */
export async function saveMaterialCategories(rows: unknown): Promise<AdminActionResult> {
  const parsed = z.array(categorySchema).max(50).safeParse(rows);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  const names = parsed.data.map((c) => c.name);
  if (new Set(names).size !== names.length) return { ok: false, message: "יש שתי קטגוריות עם אותו שם" };

  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { data: existing, error: readError } = await supabase.from("material_categories").select("id");
  if (readError) return { ok: false, message: "השמירה נכשלה" };
  const keep = new Set(parsed.data.flatMap((c) => (c.id ? [c.id] : [])));
  const drop = (existing ?? []).map((r: { id: string }) => r.id).filter((id) => !keep.has(id));
  if (drop.length > 0) {
    const { error } = await supabase.from("material_categories").delete().in("id", drop);
    if (error) return { ok: false, message: "השמירה נכשלה" };
  }

  const ids: string[] = [];
  for (const [index, c] of parsed.data.entries()) {
    const values = { name: c.name, sort_order: index + 1 };
    if (c.id) {
      const { error } = await supabase.from("material_categories").update(values).eq("id", c.id);
      if (error) return { ok: false, message: error.code === "23505" ? `הקטגוריה "${c.name}" כבר קיימת` : "השמירה נכשלה" };
      ids.push(c.id);
    } else {
      const { data, error } = await supabase.from("material_categories").insert(values).select("id").single();
      if (error || !data) return { ok: false, message: error?.code === "23505" ? `הקטגוריה "${c.name}" כבר קיימת` : "השמירה נכשלה" };
      ids.push(z.object({ id: z.string() }).parse(data).id);
    }
  }
  refresh();
  return { ok: true, message: "הקטגוריות נשמרו", ids };
}

const STOCK_REASONS = ["purchase", "count", "usage"] as const;
export type StockReason = (typeof STOCK_REASONS)[number];

const stockSchema = z.object({
  reason: z.enum(STOCK_REASONS),
  items: z.array(z.object({ id: uuid, amount })).min(1, "לא הוזנו כמויות").max(500),
  note: z.string().trim().max(200).optional(),
});

const STOCK_MESSAGES: Record<StockReason, string> = {
  purchase: "הקנייה נקלטה במלאי",
  count: "ספירת המלאי נשמרה",
  usage: "השימוש נרשם והמלאי עודכן",
};

/** Purchase (add), count (set) or manual usage (subtract) for several materials at once. */
export async function recordStock(input: unknown): Promise<AdminActionResult> {
  const parsed = stockSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { error } = await supabase.rpc("record_stock", {
    p_reason: parsed.data.reason,
    p_items: parsed.data.items,
    p_note: parsed.data.note ?? null,
  });
  if (error) return { ok: false, message: "העדכון נכשל" };
  refresh();
  return { ok: true, message: STOCK_MESSAGES[parsed.data.reason] };
}
