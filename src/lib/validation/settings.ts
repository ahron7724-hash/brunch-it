import { z } from "zod";

import { DEFAULT_SETTINGS, FONT_KEYS } from "@/lib/settings/defaults";

const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i, "צבע לא תקין");
const shortText = (max: number) => z.string().trim().max(max);

const d = DEFAULT_SETTINGS;

/**
 * Validates the `site_settings.data` JSON. Every field falls back to its default
 * when missing or invalid, so a bad value can never break the site or inject styles.
 */
export const siteSettingsSchema = z.object({
  businessName: shortText(60).min(1).catch(d.businessName),
  tagline: shortText(80).catch(d.tagline),
  logoUrl: z.string().url().max(2048).nullable().catch(d.logoUrl),
  colors: z
    .object({
      primary: hexColor.catch(d.colors.primary),
      accent: hexColor.catch(d.colors.accent),
      background: hexColor.catch(d.colors.background),
      surface: hexColor.catch(d.colors.surface),
      text: hexColor.catch(d.colors.text),
    })
    .catch(d.colors),
  font: z.enum(FONT_KEYS).catch(d.font),
  heroEyebrow: shortText(60).catch(d.heroEyebrow),
  heroTitle: shortText(120).min(1).catch(d.heroTitle),
  heroSubtitle: shortText(300).catch(d.heroSubtitle),
  phone: shortText(20).catch(d.phone),
  whatsapp: shortText(20).catch(d.whatsapp),
  orderEmail: z.union([z.literal(""), z.string().trim().email().max(254)]).catch(d.orderEmail),
  pickupAddress: shortText(200).catch(d.pickupAddress),
  pickupMapUrl: z.union([z.literal(""), z.string().url().max(2048)]).catch(d.pickupMapUrl),
  kashrutLine: shortText(120).catch(d.kashrutLine),
  defaultLeadTimeHours: z.number().int().min(0).max(24 * 60).catch(d.defaultLeadTimeHours),
  deliveryEnabled: z.boolean().catch(d.deliveryEnabled),
});
