"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { revalidateSite } from "@/lib/admin/revalidate";
import { saveSettingsPatch } from "@/lib/admin/settings";
import { adminClient, NOT_AUTHORIZED, type AdminActionResult } from "@/lib/auth/admin";
import { FONT_KEYS } from "@/lib/settings/defaults";
import { checkbox, ownImageUrlSchema } from "@/lib/validation/admin";
import { phoneSchema } from "@/lib/validation/order";

const hex = z.string().regex(/^#[0-9a-f]{6}$/i, "צבע לא תקין");
const text = (max: number, message = "הטקסט ארוך מדי") => z.string().trim().max(max, message);

const settingsSchema = z.object({
  businessName: text(60).min(1, "נא למלא שם עסק"),
  tagline: text(80),
  logoUrl: z.union([z.literal(""), ownImageUrlSchema]),
  font: z.enum(FONT_KEYS),
  primary: hex,
  accent: hex,
  background: hex,
  surface: hex,
  textColor: hex,
  heroEyebrow: text(60),
  heroTitle: text(120).min(1, "נא למלא כותרת ראשית"),
  heroSubtitle: text(300),
  headerOnScroll: checkbox,
  phone: z.union([z.literal(""), phoneSchema]),
  whatsapp: z.union([z.literal(""), phoneSchema]),
  orderEmail: z.union([z.literal(""), z.string().trim().email("כתובת דוא״ל לא תקינה").max(254)]),
  pickupAddress: text(200),
  pickupMapUrl: z.union([z.literal(""), z.string().trim().url("קישור לא תקין").max(2048).refine((v) => v.startsWith("https://"), "הקישור צריך להתחיל ב-https://")]),
  kashrutLine: text(120),
});

export async function saveSettings(_prev: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> {
  const field = (name: string) => formData.get(name) ?? "";
  const parsed = settingsSchema.safeParse({
    businessName: field("businessName"),
    tagline: field("tagline"),
    logoUrl: field("logoUrl"),
    font: field("font"),
    primary: field("primary"),
    accent: field("accent"),
    background: field("background"),
    surface: field("surface"),
    textColor: field("textColor"),
    heroEyebrow: field("heroEyebrow"),
    heroTitle: field("heroTitle"),
    heroSubtitle: field("heroSubtitle"),
    headerOnScroll: field("headerOnScroll"),
    phone: field("phone"),
    whatsapp: field("whatsapp"),
    orderEmail: field("orderEmail"),
    pickupAddress: field("pickupAddress"),
    pickupMapUrl: field("pickupMapUrl"),
    kashrutLine: field("kashrutLine"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  const d = parsed.data;

  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;
  const saved = await saveSettingsPatch(supabase, {
    businessName: d.businessName,
    tagline: d.tagline,
    logoUrl: d.logoUrl || null,
    font: d.font,
    colors: { primary: d.primary, accent: d.accent, background: d.background, surface: d.surface, text: d.textColor },
    heroEyebrow: d.heroEyebrow,
    heroTitle: d.heroTitle,
    heroSubtitle: d.heroSubtitle,
    headerOnScroll: d.headerOnScroll,
    phone: d.phone,
    whatsapp: d.whatsapp,
    orderEmail: d.orderEmail,
    pickupAddress: d.pickupAddress,
    pickupMapUrl: d.pickupMapUrl,
    kashrutLine: d.kashrutLine,
  });
  if (!saved) return { ok: false, message: "השמירה נכשלה" };

  revalidateSite();
  revalidatePath("/admin", "layout");
  return { ok: true, message: "נשמר. השינויים מופיעים באתר." };
}
