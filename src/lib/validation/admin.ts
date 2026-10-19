import { z } from "zod";

import { storagePathFromUrl } from "@/lib/admin/storage";

import { DIET_TAGS } from "./content";

// Validation for admin inputs. Admins are trusted users, but their requests are still
// public endpoints, so every field is bounded and typed before it reaches the database.

export const uuid = z.string().uuid();

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v));

/** Checkbox value from FormData. */
export const checkbox = z.preprocess((v) => v === "on" || v === "true", z.boolean());

/** Optional whole number from a form field ("" → null). */
const optionalInt = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? null : Number(v)), z.number().int().min(min).max(max).nullable());

export const productDetailsSchema = z.object({
  title: z.string().trim().min(1, "נא למלא שם מוצר").max(120),
  slug: z
    .string()
    .trim()
    .max(140)
    .regex(/^$|^[a-z0-9א-ת]+(-[a-z0-9א-ת]+)*$/, "כתובת: אותיות, ספרות ומקפים בלבד"),
  description: optionalText(4000),
  contents: optionalText(2000),
  leadTimeHours: optionalInt(0, 24 * 60),
  dietTags: z.array(z.enum(DIET_TAGS)).max(4),
  categoryIds: z.array(uuid).max(50),
  allowsCustomText: checkbox,
  customTextLabel: optionalText(80),
  isActive: checkbox,
  isFeatured: checkbox,
  sortOrder: z.coerce.number().int().min(0).max(10000),
});

export const sizeRowSchema = z.object({
  id: uuid.optional(),
  label: z.string().trim().min(1, "לכל גודל צריך שם").max(60),
  price: z.coerce.number().nonnegative("מחיר לא תקין").max(100000),
  unitCount: z.preprocess((v) => (v === "" || v === undefined ? 1 : v), z.coerce.number().int("יחידות במארז: מספר שלם").min(1, "יחידות במארז: לפחות 1").max(10000)),
  serves: optionalText(80),
});

export const sizesSchema = z.array(sizeRowSchema).max(3, "עד 3 גדלים");

export const optionRowSchema = z.object({
  id: uuid.optional(),
  groupName: z.string().trim().min(1, "לכל אפשרות צריך קבוצה (למשל: טעם)").max(60),
  label: z.string().trim().min(1, "לכל אפשרות צריך שם").max(80),
  extraPrice: z.coerce.number().nonnegative().max(100000),
});

export const optionsSchema = z.array(optionRowSchema).max(30);

/** Only images uploaded to our own storage bucket (or the bundled demo images) are accepted. */
export const ownImageUrlSchema = z
  .string()
  .max(2048)
  .refine((v) => storagePathFromUrl(v) !== null || /^\/demo\/[a-z0-9-]+\.webp$/.test(v), "תמונה לא תקינה");

export const altSchema = z.string().trim().max(200);

export const productImageInputSchema = z.object({
  id: uuid.optional(),
  url: ownImageUrlSchema,
  alt: altSchema,
});

export const productImagesSchema = z.array(productImageInputSchema).max(3, "עד 3 תמונות");

/** Parses a JSON string field from FormData (bounded), or returns undefined. */
export function jsonField(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string" || value.length > 100_000) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

export const trayDetailsSchema = z.object({
  title: z.string().trim().min(1, "נא למלא שם למגש").max(120),
  slug: productDetailsSchema.shape.slug,
  description: optionalText(2000),
  imageUrl: z.union([z.literal(""), ownImageUrlSchema]),
  leadTimeHours: optionalInt(0, 24 * 60),
  isActive: checkbox,
  sortOrder: z.coerce.number().int().min(0).max(10000),
});

export const traySizesSchema = z
  .array(
    z.object({
      id: uuid.optional(),
      label: z.string().trim().min(1, "לכל גודל צריך שם (למשל: מגש 12)").max(60),
      // Empty = singles: the customer picks any amount.
      capacity: z.preprocess(
        (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
        z.number({ message: "מספר יחידות לא תקין" }).int("מספר יחידות: מספר שלם").min(1, "מספר יחידות: לפחות 1").max(200, "עד 200 יחידות במגש").nullable()
      ),
    })
  )
  .max(10, "עד 10 גדלים");

export const trayItemsSchema = z
  .array(
    z.object({
      id: uuid.optional(),
      name: z.string().trim().min(1, "לכל פריט צריך שם").max(80),
      price: z.coerce.number().nonnegative("מחיר לא תקין").max(100000),
      imageUrl: z.union([z.literal(""), ownImageUrlSchema]),
      isActive: z.boolean(),
    })
  )
  .max(60, "עד 60 פריטים");
