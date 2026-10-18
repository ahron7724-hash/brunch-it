import "server-only";

import { cache } from "react";
import { z } from "zod";

import { buildBookingDays, type DateOverride, type WeeklySlot } from "@/lib/booking/calendar";
import { israelToday } from "@/lib/booking/time";
import type { BookingConfig } from "@/lib/booking/types";
import { getSettings } from "@/lib/settings/get-settings";
import { createPublicClient } from "@/lib/supabase/public";
import { parseRows } from "@/lib/validation/content";

/** How far ahead customers can book. */
export const BOOKING_HORIZON_DAYS = 90;

const time = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/)
  .transform((t) => t.slice(0, 5));

const slotSchema = z.object({ start: time, end: time }).refine((s) => s.end > s.start);

const weeklyRowSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  slot_start: time,
  slot_end: time,
});

const overrideRowSchema = z.object({
  override_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_blocked: z.boolean(),
  custom_slots: z.array(slotSchema).max(10).nullable().catch(null),
  note: z.string().max(200).nullable(),
});

export const getBookingConfig = cache(async (): Promise<BookingConfig> => {
  const settings = await getSettings();
  const today = israelToday();
  const empty: BookingConfig = {
    days: buildBookingDays(today, BOOKING_HORIZON_DAYS, [], []),
    defaultLeadTimeHours: settings.defaultLeadTimeHours,
    minLeadTimeHours: settings.defaultLeadTimeHours,
  };

  const supabase = createPublicClient();
  if (!supabase) return empty;

  const [weeklyRes, overridesRes, leadRes] = await Promise.all([
    supabase.from("time_slot_settings").select("day_of_week, slot_start, slot_end").eq("is_active", true),
    supabase.from("date_overrides").select("override_date, is_blocked, custom_slots, note").gte("override_date", today),
    supabase
      .from("products")
      .select("min_lead_time_hours")
      .eq("is_active", true)
      .not("min_lead_time_hours", "is", null)
      .order("min_lead_time_hours")
      .limit(1),
  ]);

  if (weeklyRes.error || overridesRes.error) return empty;

  const weekly: WeeklySlot[] = parseRows(weeklyRowSchema, weeklyRes.data)
    .filter((r) => r.slot_end > r.slot_start)
    .map((r) => ({ dayOfWeek: r.day_of_week, start: r.slot_start, end: r.slot_end }));

  const overrides: DateOverride[] = parseRows(overrideRowSchema, overridesRes.data).map((r) => ({
    date: r.override_date,
    isBlocked: r.is_blocked,
    customSlots: r.custom_slots,
    note: r.note,
  }));

  const shortestProduct = z
    .array(z.object({ min_lead_time_hours: z.number().int().nonnegative() }))
    .catch([])
    .parse(leadRes.data ?? [])[0]?.min_lead_time_hours;

  return {
    days: buildBookingDays(today, BOOKING_HORIZON_DAYS, weekly, overrides),
    defaultLeadTimeHours: settings.defaultLeadTimeHours,
    minLeadTimeHours: Math.min(settings.defaultLeadTimeHours, shortestProduct ?? Infinity),
  };
});
