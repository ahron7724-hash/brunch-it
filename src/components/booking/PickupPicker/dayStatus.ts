import { isReadyBy } from "@/lib/booking/availability";
import type { BookingDay, Slot } from "@/lib/booking/types";

export type SlotStatus = { slot: Slot; open: boolean };

/** Slots of a day, each marked open if there is still time to prepare the quickest product for it. */
export function slotStatuses(day: BookingDay, minLeadTimeHours: number, now: number): SlotStatus[] {
  return day.slots.map((slot) => ({ slot, open: isReadyBy(minLeadTimeHours, day.date, slot, now) }));
}

/** Why a day can't be chosen, or null if at least one of its slots is open. */
export function dayClosedReason(day: BookingDay, minLeadTimeHours: number, now: number): string | null {
  if (day.closedReason) return day.closedReason;
  return slotStatuses(day, minLeadTimeHours, now).some((s) => s.open) ? null : "מאוחר מדי להזמנה לתאריך זה";
}
