import "server-only";

import { z } from "zod";

import { buildBookingDays, type WeeklySlot } from "@/lib/booking/calendar";
import { addDays, israelToday } from "@/lib/booking/time";
import { BOOKING_HORIZON_DAYS } from "@/lib/data/booking";
import { createClient } from "@/lib/supabase/server";
import { parseRows } from "@/lib/validation/content";

export type AdminCalendarDay = {
  date: string;
  /** Closed without any action from the owner: Friday, Shabbat, a holiday, or no weekly slots. */
  autoClosed: string | null;
  /** Closed by the owner (a blocked date override). */
  blocked: boolean;
  /** Different hours set for this date. */
  customHours: boolean;
  note: string | null;
  /** Orders for pickup on this date (not counting cancelled ones). */
  orders: number;
};

const time = z.string().transform((t) => t.slice(0, 5));

export async function getAdminCalendar(): Promise<AdminCalendarDay[]> {
  const supabase = await createClient();
  const today = israelToday();
  const last = addDays(today, BOOKING_HORIZON_DAYS - 1);

  const [weeklyRes, overridesRes, ordersRes] = await Promise.all([
    supabase.from("time_slot_settings").select("day_of_week, slot_start, slot_end").eq("is_active", true),
    supabase.from("date_overrides").select("override_date, is_blocked, custom_slots, note").gte("override_date", today).lte("override_date", last),
    supabase.from("orders").select("pickup_date").neq("status", "cancelled").gte("pickup_date", today).lte("pickup_date", last),
  ]);

  const weekly: WeeklySlot[] = parseRows(z.object({ day_of_week: z.number(), slot_start: time, slot_end: time }), weeklyRes.data).map((r) => ({
    dayOfWeek: r.day_of_week,
    start: r.slot_start,
    end: r.slot_end,
  }));
  const overrides = new Map(
    parseRows(
      z.object({ override_date: z.string(), is_blocked: z.boolean(), custom_slots: z.array(z.unknown()).nullable().catch(null), note: z.string().nullable() }),
      overridesRes.data
    ).map((o) => [o.override_date, o])
  );
  const orderCounts = new Map<string, number>();
  for (const row of parseRows(z.object({ pickup_date: z.string() }), ordersRes.data)) {
    orderCounts.set(row.pickup_date, (orderCounts.get(row.pickup_date) ?? 0) + 1);
  }

  // Automatic rules only (no overrides), so owner blocks are shown separately.
  return buildBookingDays(today, BOOKING_HORIZON_DAYS, weekly, []).map((day) => {
    const override = overrides.get(day.date);
    return {
      date: day.date,
      autoClosed: day.closedReason,
      blocked: override?.is_blocked ?? false,
      customHours: Boolean(override && !override.is_blocked && override.custom_slots && override.custom_slots.length > 0),
      note: override?.note ?? null,
      orders: orderCounts.get(day.date) ?? 0,
    };
  });
}
