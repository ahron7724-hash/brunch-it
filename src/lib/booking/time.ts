// Israel-local date/time helpers. All pickup dates and slots are Israel local time,
// regardless of the server's or the visitor's time zone.

export const TIME_ZONE = "Asia/Jerusalem";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME = /^(\d{2}):(\d{2})/;

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });

/** Today's date in Israel as YYYY-MM-DD. */
export function israelToday(now: number = Date.now()): string {
  return dateFormatter.format(new Date(now));
}

/** Offset (ms) between Israel local time and UTC at the given instant. */
function israelOffset(epoch: number): number {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(new Date(epoch)).map((p) => [p.type, Number(p.value)])
  );
  const asUtc = Date.UTC(
    parts.year ?? 0,
    (parts.month ?? 1) - 1,
    parts.day ?? 1,
    parts.hour ?? 0,
    parts.minute ?? 0,
    parts.second ?? 0
  );
  return asUtc - epoch;
}

/** Epoch ms of an Israel-local date ("2026-10-14") and time ("10:00"). Null if either is malformed. */
export function israelEpoch(isoDate: string, time: string): number | null {
  const d = ISO_DATE.exec(isoDate);
  const t = TIME.exec(time);
  if (!d || !t) return null;
  const [, y, m, day] = d.map(Number);
  const [, h, min] = t.map(Number);
  if ([y, m, day, h, min].some((n) => n === undefined || Number.isNaN(n))) return null;
  const guess = Date.UTC(y ?? 0, (m ?? 1) - 1, day ?? 1, h ?? 0, min ?? 0);
  // Two passes handle the hour around a daylight-saving switch.
  const first = guess - israelOffset(guess);
  return guess - israelOffset(first);
}

/** Adds whole days to an ISO date (calendar arithmetic in UTC, so no DST effects). */
export function addDays(isoDate: string, days: number): string {
  const d = ISO_DATE.exec(isoDate);
  if (!d) return isoDate;
  const [, y, m, day] = d.map(Number);
  const date = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, (day ?? 1) + days));
  return date.toISOString().slice(0, 10);
}

/** Day of week (0 = Sunday) of an ISO date. */
export function dayOfWeek(isoDate: string): number {
  const d = ISO_DATE.exec(isoDate);
  if (!d) return 0;
  const [, y, m, day] = d.map(Number);
  return new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, day ?? 1)).getUTCDay();
}
