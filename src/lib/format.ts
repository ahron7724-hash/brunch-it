const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const weekdayFormatter = new Intl.DateTimeFormat("he-IL", { weekday: "short", timeZone: "UTC" });

/** "2026-10-14" → "יום ד׳ 14.10". Returns the input unchanged if it is not a valid date. */
export function formatPickupDate(isoDate: string): string {
  const match = ISO_DATE.exec(isoDate);
  if (!match) return isoDate;
  const [, y, m, d] = match.map(Number);
  if (y === undefined || m === undefined || d === undefined) return isoDate;
  const date = new Date(Date.UTC(y, m - 1, d));
  return `${weekdayFormatter.format(date)} ${d}.${m}`;
}

/** "2027-03-31" → "31.3.2027". Returns the input unchanged if it is not a valid date. */
export function formatIsoDate(isoDate: string): string {
  const match = ISO_DATE.exec(isoDate);
  if (!match) return isoDate;
  const [, y, m, d] = match.map(Number);
  return `${d}.${m}.${y}`;
}

/** "10:00:00" or "10:00" → "10:00" */
export function formatTime(time: string): string {
  return time.slice(0, 5);
}

const priceFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export function formatPrice(amount: number): string {
  return priceFormatter.format(amount);
}
