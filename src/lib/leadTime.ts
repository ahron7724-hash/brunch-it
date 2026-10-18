/** Effective lead time for a product: its own value, or the site default when it has none. */
export function effectiveLeadTimeHours(productHours: number | null, defaultHours: number): number {
  return productHours ?? defaultHours;
}

/** 48 → "יומיים", 24 → "יום", 72 → "3 ימים", 6 → "6 שעות" */
export function formatLeadTime(hours: number): string {
  if (hours % 24 !== 0) return `${hours} שעות`;
  const days = hours / 24;
  if (days === 1) return "יום";
  if (days === 2) return "יומיים";
  return `${days} ימים`;
}
