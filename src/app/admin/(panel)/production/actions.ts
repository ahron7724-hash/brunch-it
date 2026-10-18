"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AI_MODEL, generateJson } from "@/lib/ai/gemini";
import { adminClient, NOT_AUTHORIZED, type AdminActionResult } from "@/lib/auth/admin";
import { israeliHolidays } from "@/lib/booking/calendar";
import { addDays, israelToday } from "@/lib/booking/time";
import { aiPlanSchema, checkPlan, type SavedPlan } from "@/lib/inventory/aiPlan";
import { plannerPrompt } from "@/lib/inventory/aiPrompts";
import { buildBatches, formatAmount, shoppingList } from "@/lib/inventory/calc";
import { getKitchenRules, listActiveOrderLines, listMaterials, listPrepSteps, listProductCategories, listRecipes } from "@/lib/inventory/data";
import { uuid } from "@/lib/validation/admin";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Ticks a prep step off (or back on) for one pickup date. */
export async function setStepDone(stepId: string, pickupDate: string, done: boolean): Promise<AdminActionResult> {
  const id = uuid.safeParse(stepId);
  const date = isoDate.safeParse(pickupDate);
  if (!id.success || !date.success || typeof done !== "boolean") return { ok: false, message: "בקשה לא תקינה" };
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { error } = done
    ? await supabase.from("prep_step_done").upsert({ step_id: id.data, pickup_date: date.data }, { ignoreDuplicates: true })
    : await supabase.from("prep_step_done").delete().eq("step_id", id.data).eq("pickup_date", date.data);
  if (error) return { ok: false, message: "העדכון נכשל" };
  revalidatePath("/admin/production");
  return { ok: true };
}

/** Saves the kitchen's rules that the AI planner follows. */
export async function saveKitchenRules(rules: string): Promise<AdminActionResult> {
  const text = z.string().trim().max(4000, "עד 4000 תווים").safeParse(rules);
  if (!text.success) return { ok: false, message: text.error.issues[0]?.message ?? "טקסט לא תקין" };
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { error } = await supabase.from("kitchen_settings").upsert({ id: 1, rules: text.data });
  if (error) return { ok: false, message: "השמירה נכשלה" };
  revalidatePath("/admin/production");
  return { ok: true, message: "כללי המטבח נשמרו" };
}

/**
 * Builds an AI production plan for a pickup range: quantities are computed here,
 * Gemini only arranges the batches into days and tasks, and the result is checked and saved.
 */
export async function generateAiPlan(fromDate: string, toDate: string, instructions: string): Promise<AdminActionResult> {
  const from = isoDate.safeParse(fromDate);
  const to = isoDate.safeParse(toDate);
  const note = z.string().trim().max(1000).safeParse(instructions);
  if (!from.success || !to.success || !note.success || to.data < from.data) return { ok: false, message: "בקשה לא תקינה" };
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const [lines, recipes, materials, steps, rules, categories] = await Promise.all([
    listActiveOrderLines(from.data, to.data),
    listRecipes(),
    listMaterials(),
    listPrepSteps(),
    getKitchenRules(),
    listProductCategories(),
  ]);
  if (lines.length === 0) return { ok: false, message: "אין הזמנות פעילות בטווח הזה" };

  const batches = buildBatches(lines, recipes, materials, categories);
  const today = israelToday();
  const shortages = shoppingList(lines, recipes, materials).measured.map((r) => `${r.material.name} ${formatAmount(r.toBuy, r.material.unit)}`);
  const { system, prompt } = plannerPrompt({
    today,
    rules,
    batches,
    steps,
    holidays: israeliHolidays(addDays(from.data, -7), to.data),
    shortages,
    instructions: note.data,
  });

  const result = await generateJson(aiPlanSchema, system, prompt);
  if (!result.ok) return result;

  const { plan, warnings } = checkPlan(result.data, batches);
  const saved: SavedPlan = { ...plan, batches, warnings, instructions: note.data || undefined };
  const { error } = await supabase.from("ai_plans").insert({ from_date: from.data, to_date: to.data, plan: saved, model: result.model ?? AI_MODEL });
  if (error) return { ok: false, message: "התוכנית נוצרה אבל לא נשמרה. נסו שוב." };

  revalidatePath("/admin/production");
  return { ok: true, message: warnings.length > 0 ? `התוכנית מוכנה – יש ${warnings.length} הערות לבדיקה` : "התוכנית מוכנה" };
}
