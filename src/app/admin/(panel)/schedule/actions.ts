"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { revalidateSite } from "@/lib/admin/revalidate";
import { saveSettingsPatch } from "@/lib/admin/settings";
import { adminClient, NOT_AUTHORIZED, type AdminActionResult } from "@/lib/auth/admin";
import { checkbox, uuid } from "@/lib/validation/admin";

const time = z.string().regex(/^\d{2}:\d{2}$/, "שעה לא תקינה");
const slotSchema = z
  .object({ start: time, end: time })
  .refine((s) => s.end > s.start, "שעת הסיום צריכה להיות אחרי שעת ההתחלה");

function refresh() {
  revalidateSite();
  revalidatePath("/admin/schedule");
}

export async function saveLeadTime(_prev: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> {
  const hours = z.coerce.number().int().min(0, "מספר לא תקין").max(1440).safeParse(formData.get("defaultLeadTimeHours"));
  if (!hours.success) return { ok: false, message: hours.error.issues[0]?.message ?? "מספר לא תקין" };
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;
  if (!(await saveSettingsPatch(supabase, { defaultLeadTimeHours: hours.data }))) return { ok: false, message: "השמירה נכשלה" };
  refresh();
  return { ok: true };
}

/** Replaces the fixed pickup slots of one weekday. */
export async function saveWeekdaySlots(dayOfWeek: number, rows: unknown): Promise<AdminActionResult> {
  const day = z.number().int().min(0).max(6).safeParse(dayOfWeek);
  const slots = z.array(slotSchema).max(6).safeParse(rows);
  if (!day.success || !slots.success) return { ok: false, message: slots.error?.issues[0]?.message ?? "נתונים לא תקינים" };
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { error: deleteError } = await supabase.from("time_slot_settings").delete().eq("day_of_week", day.data);
  if (deleteError) return { ok: false, message: "השמירה נכשלה" };
  if (slots.data.length > 0) {
    const { error } = await supabase
      .from("time_slot_settings")
      .insert(slots.data.map((s) => ({ day_of_week: day.data, slot_start: s.start, slot_end: s.end, is_active: true })));
    if (error) return { ok: false, message: "השמירה נכשלה" };
  }
  refresh();
  return { ok: true, message: "השעות נשמרו" };
}

const overrideSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "נא לבחור תאריך"),
    isBlocked: checkbox,
    note: z.string().trim().max(200),
    slot1Start: z.string(),
    slot1End: z.string(),
    slot2Start: z.string(),
    slot2End: z.string(),
  })
  .transform((v) => ({
    ...v,
    slots: [
      { start: v.slot1Start, end: v.slot1End },
      { start: v.slot2Start, end: v.slot2End },
    ].filter((s) => s.start && s.end),
  }));

export async function saveDateOverride(_prev: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> {
  const parsed = overrideSchema.safeParse({
    date: formData.get("date"),
    isBlocked: formData.get("isBlocked"),
    note: formData.get("note") ?? "",
    slot1Start: formData.get("slot1Start") ?? "",
    slot1End: formData.get("slot1End") ?? "",
    slot2Start: formData.get("slot2Start") ?? "",
    slot2End: formData.get("slot2End") ?? "",
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  const slots = z.array(slotSchema).safeParse(parsed.data.slots);
  if (!slots.success) return { ok: false, message: slots.error.issues[0]?.message ?? "שעות לא תקינות" };
  const d = parsed.data;
  if (!d.isBlocked && slots.data.length === 0) {
    return { ok: false, message: "יש לסמן \"חסימת היום\" או להזין לפחות חלון שעות אחד" };
  }

  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;
  const { error } = await supabase.from("date_overrides").upsert(
    { override_date: d.date, is_blocked: d.isBlocked, custom_slots: d.isBlocked ? null : slots.data, note: d.note || null },
    { onConflict: "override_date" }
  );
  if (error) return { ok: false, message: "השמירה נכשלה" };
  refresh();
  return { ok: true, message: "התאריך נשמר" };
}

export async function deleteDateOverride(overrideId: string): Promise<AdminActionResult> {
  const id = uuid.safeParse(overrideId);
  if (!id.success) return { ok: false, message: "בקשה לא תקינה" };
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;
  const { error } = await supabase.from("date_overrides").delete().eq("id", id.data);
  if (error) return { ok: false, message: "המחיקה נכשלה" };
  refresh();
  return { ok: true };
}

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Blocks or reopens a single date from the admin calendar. */
export async function setDateBlocked(date: string, blocked: boolean, note: string): Promise<AdminActionResult> {
  const day = dateSchema.safeParse(date);
  const block = z.boolean().safeParse(blocked);
  const reason = z.string().trim().max(200).safeParse(note);
  if (!day.success || !block.success || !reason.success) return { ok: false, message: "בקשה לא תקינה" };
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { error } = block.data
    ? await supabase
        .from("date_overrides")
        .upsert({ override_date: day.data, is_blocked: true, custom_slots: null, note: reason.data || null }, { onConflict: "override_date" })
    : await supabase.from("date_overrides").delete().eq("override_date", day.data);
  if (error) return { ok: false, message: "העדכון נכשל" };
  refresh();
  return { ok: true, message: block.data ? "היום נחסם" : "היום נפתח" };
}
