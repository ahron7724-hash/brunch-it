import { z } from "zod";

import { imageUrlSchema } from "./content";

// Schemas for data read back from localStorage (untrusted: the user can edit it).

const time = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/);

export const pickupSlotSchema = z.object({ start: time, end: time });

export const persistedBookingSchema = z.object({
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  pickupSlot: pickupSlotSchema.nullable(),
});

export const cartItemSchema = z.object({
  key: z.string().max(400),
  productId: z.string().uuid(),
  sizeId: z.string().uuid(),
  title: z.string().max(200),
  sizeLabel: z.string().max(80),
  unitPrice: z.number().nonnegative().max(1_000_000),
  quantity: z.number().int().min(1).max(99),
  imageUrl: imageUrlSchema.nullable(),
  customText: z.string().max(200).optional(),
  optionIds: z.array(z.string().uuid()).max(20).optional(),
  optionLabels: z.array(z.string().max(160)).max(50).optional(),
  leadTimeHours: z.number().int().nonnegative().max(24 * 60).nullable(),
  slug: z.string().max(140),
  /** "tray": a build-your-own tray; productId/sizeId are the tray and tray-size ids. */
  kind: z.enum(["product", "tray"]).optional(),
  trayItems: z.array(z.object({ id: z.string().uuid(), quantity: z.number().int().min(1).max(200) })).max(50).optional(),
});

export const persistedCartSchema = z.object({
  items: z.array(cartItemSchema).max(50),
});
