"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { adminClient, NOT_AUTHORIZED, type AdminActionResult } from "@/lib/auth/admin";
import { uuid } from "@/lib/validation/admin";

const itemSchema = z.object({
  optionId: uuid.nullable(),
  materialId: uuid,
  /** Ignored for manual materials (the database clears it). */
  amount: z.number().positive("כמות ליחידה צריכה להיות גדולה מ-0").max(1_000_000).nullable(),
});

const stepSchema = z.object({
  id: uuid.optional(),
  title: z.string().trim().min(1, "לכל שלב צריך שם").max(120),
  daysBefore: z.coerce.number().int().min(0).max(14),
});

const recipeSchema = z.object({
  items: z.array(itemSchema).max(300),
  steps: z.array(stepSchema).max(30, "עד 30 שלבים"),
  notes: z.string().trim().max(2000, "ההערות ארוכות מדי (עד 2000 תווים)"),
});

export async function saveRecipe(productId: string, input: unknown): Promise<AdminActionResult> {
  const id = uuid.safeParse(productId);
  const parsed = recipeSchema.safeParse(input);
  if (!id.success) return { ok: false, message: "בקשה לא תקינה" };
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  const keys = parsed.data.items.map((i) => `${i.optionId ?? ""}|${i.materialId}`);
  if (new Set(keys).size !== keys.length) return { ok: false, message: "אותו חומר גלם מופיע פעמיים באותו חלק של המתכון" };

  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { error } = await supabase.rpc("save_recipe", {
    p_product_id: id.data,
    p_items: parsed.data.items.map((i) => ({ option_id: i.optionId, raw_material_id: i.materialId, amount_per_unit: i.amount })),
    p_steps: parsed.data.steps.map((s) => ({ id: s.id ?? null, title: s.title, days_before: s.daysBefore })),
  });
  if (error) return { ok: false, message: "שמירת המתכון נכשלה" };

  const { notes } = parsed.data;
  const { error: notesError } = notes
    ? await supabase.from("recipe_notes").upsert({ product_id: id.data, notes })
    : await supabase.from("recipe_notes").delete().eq("product_id", id.data);
  if (notesError) return { ok: false, message: "המתכון נשמר, אבל שמירת ההערות נכשלה" };

  revalidatePath(`/admin/products/${id.data}/recipe`);
  revalidatePath("/admin/production");
  revalidatePath("/admin/inventory", "layout");
  return { ok: true, message: "המתכון נשמר" };
}
