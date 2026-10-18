/** Hebrew-friendly URL slug: "עוגת שוקולד 3 קומות!" → "עוגת-שוקולד-3-קומות". Matches the DB slug check. */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[֑-ׇ]/g, "") // Hebrew vowel points
    .replace(/[^a-z0-9א-ת]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}
