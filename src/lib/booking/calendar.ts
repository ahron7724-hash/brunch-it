import "server-only";

import { HebrewCalendar, flags } from "@hebcal/core";

import { addDays, dayOfWeek } from "./time";
import type { BookingDay, Slot } from "./types";

export type WeeklySlot = Slot & { dayOfWeek: number };
export type DateOverride = { date: string; isBlocked: boolean; customSlots: Slot[] | null; note: string | null };

/** Israeli yom-tov days (no work) between two ISO dates, keyed by date, valued by the holiday name. */
export function israeliHolidays(from: string, to: string): Map<string, string> {
  const events = HebrewCalendar.calendar({
    start: new Date(`${from}T12:00:00Z`),
    end: new Date(`${to}T12:00:00Z`),
    il: true,
    noMinorFast: true,
    noModern: true,
    noRoshChodesh: true,
    noSpecialShabbat: true,
  });

  const holidays = new Map<string, string>();
  for (const event of events) {
    if (!(event.getFlags() & flags.CHAG)) continue;
    const date = event.getDate().greg();
    const iso = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
      .map((n, i) => String(n).padStart(i === 0 ? 4 : 2, "0"))
      .join("-");
    holidays.set(iso, event.render("he-x-NoNikud"));
  }
  return holidays;
}

/**
 * Builds the pickup calendar for `days` days starting at `from`.
 * Priority: admin date override > Friday/Shabbat > holiday > weekly slots.
 */
export function buildBookingDays(
  from: string,
  days: number,
  weekly: WeeklySlot[],
  overrides: DateOverride[]
): BookingDay[] {
  const to = addDays(from, days - 1);
  const holidays = israeliHolidays(from, to);
  const overrideByDate = new Map(overrides.map((o) => [o.date, o]));

  return Array.from({ length: days }, (_, i) => {
    const date = addDays(from, i);
    const dow = dayOfWeek(date);
    const override = overrideByDate.get(date);

    if (override?.isBlocked) return closed(date, override.note ?? "סגור בתאריך זה");
    if (dow === 5) return closed(date, "שישי");
    if (dow === 6) return closed(date, "שבת");

    const holiday = holidays.get(date);
    if (holiday) return closed(date, holiday);

    const slots = override?.customSlots ?? weekly.filter((s) => s.dayOfWeek === dow);
    const sorted = [...slots].map(({ start, end }) => ({ start, end })).sort((a, b) => a.start.localeCompare(b.start));
    return sorted.length > 0 ? { date, closedReason: null, slots: sorted } : closed(date, "אין איסוף ביום זה");
  });
}

function closed(date: string, reason: string): BookingDay {
  return { date, closedReason: reason, slots: [] };
}
