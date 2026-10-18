import { z } from "zod";

import { safeHref } from "@/lib/security/safeHref";

// Row schemas for content read from Supabase. Rows are written by the admin, but are still
// validated at this boundary so a bad value can't break a page or produce an unsafe link.

/** Image source: an internal path (/demo/x.webp) or an https URL. */
export const imageUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => {
    const href = safeHref(v);
    return href !== null && (href.startsWith("/") || href.startsWith("https:"));
  }, "כתובת תמונה לא תקינה");

const price = z.coerce.number().nonnegative().max(1_000_000);

export const DIET_TAGS = ["dairy", "parve", "gluten_free", "vegan"] as const;
export const dietTagSchema = z.enum(DIET_TAGS);
export type DietTag = z.infer<typeof dietTagSchema>;

export const categoryRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(80),
  slug: z.string().max(100),
  description: z.string().max(1000).nullable(),
  image_url: imageUrlSchema.nullable().catch(null),
});

export const productImageRowSchema = z.object({
  url: imageUrlSchema,
  alt: z.string().max(200).nullable(),
  sort_order: z.number().int(),
});

export const productSizeRowSchema = z.object({
  id: z.string().uuid(),
  label: z.string().max(60),
  price,
  serves: z.string().max(80).nullable(),
  sort_order: z.number().int(),
});

export const productOptionRowSchema = z.object({
  id: z.string().uuid(),
  group_name: z.string().max(60),
  label: z.string().max(80),
  extra_price: price,
  sort_order: z.number().int(),
  is_active: z.boolean(),
});

const categoryLinkSchema = z.object({
  categories: z.object({ name: z.string().max(80), slug: z.string().max(100) }).nullable(),
});

export const productRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string().max(120),
  slug: z.string().max(140),
  description: z.string().max(4000).nullable(),
  contents: z.string().max(2000).nullable(),
  min_lead_time_hours: z.number().int().nonnegative().nullable(),
  diet_tags: z.array(z.string()).transform((tags) => tags.filter((t): t is DietTag => dietTagSchema.safeParse(t).success)),
  allows_custom_text: z.boolean(),
  custom_text_label: z.string().max(80).nullable(),
  is_featured: z.boolean(),
  sort_order: z.number().int(),
  // Invalid nested rows are dropped rather than failing the whole product.
  product_images: z.array(productImageRowSchema.nullable().catch(null)).transform(compact),
  product_sizes: z.array(productSizeRowSchema.nullable().catch(null)).transform(compact),
  product_options: z.array(productOptionRowSchema.nullable().catch(null)).transform(compact).default([]),
  product_categories: z.array(categoryLinkSchema).default([]),
});

export const testimonialRowSchema = z.object({
  id: z.string().uuid(),
  client_name: z.string().max(80),
  content: z.string().max(1000),
  event_label: z.string().max(80).nullable(),
  rating: z.number().int().min(1).max(5),
  image_url: imageUrlSchema.nullable().catch(null),
});

export const mediaRowSchema = z.object({
  id: z.string().uuid(),
  url: imageUrlSchema,
  alt: z.string().max(200).nullable(),
});

export const heroSlideRowSchema = mediaRowSchema.extend({
  media_type: z.enum(["image", "video"]),
});

export const stripImageRowSchema = mediaRowSchema.extend({
  strip: z.enum(["top", "bottom"]),
});

export const galleryImageRowSchema = mediaRowSchema.extend({
  caption: z.string().max(200).nullable(),
});

export const pageRowSchema = z.object({
  slug: z.enum(["about", "kashrut"]),
  title: z.string().max(120),
  hero_image_url: imageUrlSchema.nullable().catch(null),
  body_text: z.string().max(50000),
  extra: z.record(z.string(), z.unknown()).catch({}),
});

export const kashrutExtraSchema = z.object({
  certificateUrl: imageUrlSchema.nullable().catch(null).default(null),
  supervision: z.string().max(200).catch("").default(""),
  validUntil: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .catch(null)
    .default(null),
});

function compact<T>(items: (T | null)[]): T[] {
  return items.filter((item): item is T => item !== null);
}

/** Parses each row independently and drops invalid ones, so one bad row never hides the rest. */
export function parseRows<T>(schema: z.ZodType<T>, rows: unknown): T[] {
  if (!Array.isArray(rows)) return [];
  return compact(rows.map((row) => {
    const parsed = schema.safeParse(row);
    return parsed.success ? parsed.data : null;
  }));
}
