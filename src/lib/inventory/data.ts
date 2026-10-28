import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { parseRows } from "@/lib/validation/content";

import { savedPlanSchema, type SavedPlan } from "./aiPlan";
import { TRACKING, UNITS, type Material, type MaterialCategory, type OrderLine, type PrepStep, type RecipeLine } from "./calc";

// Admin-only reads (RLS: only admins see these tables).

const num = z.coerce.number();

const materialRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  unit: z.enum(UNITS),
  tracking: z.enum(TRACKING),
  current_stock: num,
  min_stock_alert: num,
  notes: z.string().nullable(),
  category_id: z.string().uuid().nullable(),
});

export type AdminMaterial = Material & { notes: string | null; categoryId: string | null };

export async function listMaterials(): Promise<AdminMaterial[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("raw_materials")
    .select("id, name, unit, tracking, current_stock, min_stock_alert, notes, category_id")
    .order("name");
  if (error) return [];
  return parseRows(materialRowSchema, data).map((m) => ({
    id: m.id,
    name: m.name,
    unit: m.unit,
    tracking: m.tracking,
    currentStock: m.current_stock,
    minStockAlert: m.min_stock_alert,
    notes: m.notes,
    categoryId: m.category_id,
  }));
}

export async function listMaterialCategories(): Promise<MaterialCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("material_categories").select("id, name").order("sort_order").order("name");
  if (error) return [];
  return parseRows(z.object({ id: z.string().uuid(), name: z.string() }), data);
}

const recipeRowSchema = z.object({
  product_id: z.string().uuid(),
  option_id: z.string().uuid().nullable(),
  raw_material_id: z.string().uuid(),
  amount_per_unit: num.nullable(),
  sort_order: z.number().int(),
});

export async function listRecipes(productId?: string): Promise<RecipeLine[]> {
  const supabase = await createClient();
  let query = supabase.from("recipe_items").select("product_id, option_id, raw_material_id, amount_per_unit, sort_order").order("sort_order");
  if (productId) query = query.eq("product_id", productId);
  const { data, error } = await query;
  if (error) return [];
  return parseRows(recipeRowSchema, data).map((r) => ({
    productId: r.product_id,
    optionId: r.option_id,
    materialId: r.raw_material_id,
    amountPerUnit: r.amount_per_unit,
  }));
}

const stepRowSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  title: z.string(),
  days_before: z.number().int(),
  sort_order: z.number().int(),
});

export async function listPrepSteps(productId?: string): Promise<PrepStep[]> {
  const supabase = await createClient();
  let query = supabase.from("prep_steps").select("id, product_id, title, days_before, sort_order").order("sort_order");
  if (productId) query = query.eq("product_id", productId);
  const { data, error } = await query;
  if (error) return [];
  return parseRows(stepRowSchema, data).map((s) => ({
    id: s.id,
    productId: s.product_id,
    title: s.title,
    daysBefore: s.days_before,
    sortOrder: s.sort_order,
  }));
}

const recipeTextSchema = z.object({ recipe: z.string().nullable(), notes: z.string().nullable() });

/** The written recipe and the admin's notes on one product ("" when missing). */
export async function getRecipeText(productId: string): Promise<{ recipe: string; notes: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("recipe_notes").select("recipe, notes").eq("product_id", productId).maybeSingle();
  const parsed = error || !data ? null : recipeTextSchema.safeParse(data).data;
  return { recipe: parsed?.recipe ?? "", notes: parsed?.notes ?? "" };
}

const orderRowSchema = z.object({
  id: z.string().uuid(),
  pickup_date: z.string(),
  stock_deducted_at: z.string().nullable(),
  order_items: z.array(
    z.object({
      product_id: z.string().uuid().nullable(),
      product_title: z.string(),
      quantity: z.number().int(),
      unit_count: z.number().int(),
      options: z.array(z.object({ id: z.string().uuid().optional(), label: z.string() }).passthrough()).catch([]),
    })
  ),
});

/** Lines of active orders (new / confirmed / ready) with pickup dates in [from, to]. */
export async function listActiveOrderLines(from: string, to: string): Promise<OrderLine[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, pickup_date, stock_deducted_at, order_items(product_id, product_title, quantity, unit_count, options)")
    .in("status", ["new", "confirmed", "ready"])
    .gte("pickup_date", from)
    .lte("pickup_date", to)
    .order("pickup_date")
    .limit(1000);
  if (error) return [];
  return parseRows(orderRowSchema, data).flatMap((order) =>
    order.order_items.map((item) => ({
      orderId: order.id,
      pickupDate: order.pickup_date,
      stockDeducted: order.stock_deducted_at !== null,
      productId: item.product_id,
      productTitle: item.product_title,
      quantity: item.quantity,
      unitCount: item.unit_count,
      options: item.options.map((o) => ({ id: o.id ?? null, label: o.label })),
    }))
  );
}

/** Prep steps already ticked off, as "stepId|pickupDate" keys. */
export async function listDoneSteps(from: string, to: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("prep_step_done").select("step_id, pickup_date").gte("pickup_date", from).lte("pickup_date", to);
  if (error) return new Set();
  return new Set(parseRows(z.object({ step_id: z.string(), pickup_date: z.string() }), data).map((d) => `${d.step_id}|${d.pickup_date}`));
}

export const MOVEMENT_REASONS = ["order", "order_return", "purchase", "count", "usage"] as const;

export const REASON_LABELS: Record<(typeof MOVEMENT_REASONS)[number], string> = {
  order: "הזמנה אושרה",
  order_return: "החזרה מהזמנה",
  purchase: "קנייה",
  count: "ספירת מלאי",
  usage: "שימוש ידני",
};

const movementRowSchema = z.object({
  id: z.string().uuid(),
  change: num,
  reason: z.enum(MOVEMENT_REASONS),
  note: z.string().nullable(),
  created_at: z.string(),
  raw_materials: z.object({ name: z.string(), unit: z.enum(UNITS) }),
  orders: z.object({ id: z.string().uuid(), order_number: z.number().int() }).nullable(),
});

export type Movement = z.infer<typeof movementRowSchema>;

export async function listMovements(materialId?: string): Promise<Movement[]> {
  const supabase = await createClient();
  let query = supabase
    .from("stock_movements")
    .select("id, change, reason, note, created_at, raw_materials(name, unit), orders(id, order_number)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (materialId) query = query.eq("raw_material_id", materialId);
  const { data, error } = await query;
  if (error) return [];
  return parseRows(movementRowSchema, data);
}

/** The kitchen's rules for the AI planner (free text written by the admin). */
export async function getKitchenRules(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.from("kitchen_settings").select("rules").eq("id", 1).maybeSingle();
  const parsed = z.object({ rules: z.string() }).safeParse(data);
  return parsed.success ? parsed.data.rules : "";
}

/** The latest AI plan saved for exactly this date range, if any. */
export async function getLatestPlan(from: string, to: string): Promise<{ plan: SavedPlan; createdAt: string; model: string | null } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_plans")
    .select("plan, created_at, model")
    .eq("from_date", from)
    .eq("to_date", to)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const row = z.object({ plan: savedPlanSchema, created_at: z.string(), model: z.string().nullable() }).safeParse(data);
  return row.success ? { plan: row.data.plan, createdAt: row.data.created_at, model: row.data.model } : null;
}

/** Site categories of every product (for the AI planner: what kind of work each product is). */
export async function listProductCategories(): Promise<Map<string, string[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("id, product_categories(categories(name))");
  if (error) return new Map();
  const rowSchema = z.object({
    id: z.string().uuid(),
    product_categories: z.array(z.object({ categories: z.object({ name: z.string() }).nullable() })).catch([]),
  });
  return new Map(parseRows(rowSchema, data).map((p) => [p.id, p.product_categories.flatMap((c) => (c.categories ? [c.categories.name] : []))]));
}
