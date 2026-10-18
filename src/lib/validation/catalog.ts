import { z } from "zod";

import { dietTagSchema } from "./content";

/** Catalog URL filters (?diet=…&sort=…). Anything unexpected falls back to "no filter". */
export const catalogSearchSchema = z.object({
  diet: dietTagSchema.optional().catch(undefined),
  sort: z.enum(["default", "price-asc", "price-desc"]).default("default").catch("default"),
});

export type CatalogSearch = z.infer<typeof catalogSearchSchema>;

export function parseCatalogSearch(raw: Record<string, string | string[] | undefined>): CatalogSearch {
  const pick = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  return catalogSearchSchema.parse({ diet: pick(raw.diet), sort: pick(raw.sort) });
}

/** Route slugs may arrive percent-encoded (Hebrew); decode safely and bound the length. */
export const slugParamSchema = z
  .string()
  .max(600)
  .transform((value, ctx) => {
    try {
      return decodeURIComponent(value);
    } catch {
      ctx.addIssue({ code: "custom", message: "invalid slug" });
      return z.NEVER;
    }
  })
  .pipe(z.string().min(1).max(140));
