import { z } from "zod";

import { addDays, israelToday } from "@/lib/booking/time";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const MAX_DAYS = 62;

export type DateRange = { from: string; to: string };

/** Pickup date range from ?from=&to= (defaults: today → defaultDays ahead; capped at two months). */
export function parseRange(params: Record<string, string | string[] | undefined>, defaultDays: number): DateRange {
  const today = israelToday();
  const from = isoDate.catch(today).parse(params.from);
  let to = isoDate.catch(addDays(from, defaultDays)).parse(params.to);
  if (to < from) to = from;
  if (to > addDays(from, MAX_DAYS)) to = addDays(from, MAX_DAYS);
  return { from, to };
}
