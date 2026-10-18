import { israelEpoch } from "./time";
import type { Slot } from "./types";

const HOUR_MS = 60 * 60 * 1000;

/** Hours between now and the start of a pickup slot (negative when it has passed). */
export function hoursUntilSlot(date: string, slot: Slot, now: number): number | null {
  const start = israelEpoch(date, slot.start);
  return start === null ? null : (start - now) / HOUR_MS;
}

/** A product can be ordered for a slot only if its preparation time fits before the slot starts. */
export function isReadyBy(leadTimeHours: number, date: string, slot: Slot, now: number): boolean {
  const hours = hoursUntilSlot(date, slot, now);
  return hours !== null && hours >= leadTimeHours;
}
