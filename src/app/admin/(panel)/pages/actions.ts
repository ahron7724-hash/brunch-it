"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { revalidateSite } from "@/lib/admin/revalidate";
import { adminClient, NOT_AUTHORIZED, type AdminActionResult } from "@/lib/auth/admin";
import { ownImageUrlSchema } from "@/lib/validation/admin";

const optionalImage = z.union([z.literal(""), ownImageUrlSchema]);

const pageSchema = z.object({
  title: z.string().trim().min(1, "נא למלא כותרת").max(120),
  heroImageUrl: optionalImage,
  bodyText: z.string().trim().max(50000),
});

const kashrutExtraSchema = z.object({
  certificateUrl: optionalImage,
  supervision: z.string().trim().max(200),
  validUntil: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "תאריך לא תקין")]),
});

export async function savePage(slug: string, _prev: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> {
  const page = z.enum(["about", "kashrut"]).safeParse(slug);
  const parsed = pageSchema.safeParse({
    title: formData.get("title"),
    heroImageUrl: formData.get("heroImageUrl") ?? "",
    bodyText: formData.get("bodyText") ?? "",
  });
  if (!page.success || !parsed.success) return { ok: false, message: parsed.error?.issues[0]?.message ?? "נתונים לא תקינים" };

  const update: Record<string, unknown> = {
    title: parsed.data.title,
    hero_image_url: parsed.data.heroImageUrl || null,
    body_text: parsed.data.bodyText,
  };

  if (page.data === "kashrut") {
    const extra = kashrutExtraSchema.safeParse({
      certificateUrl: formData.get("certificateUrl") ?? "",
      supervision: formData.get("supervision") ?? "",
      validUntil: formData.get("validUntil") ?? "",
    });
    if (!extra.success) return { ok: false, message: extra.error.issues[0]?.message ?? "נתונים לא תקינים" };
    update.extra = {
      certificateUrl: extra.data.certificateUrl || null,
      supervision: extra.data.supervision,
      validUntil: extra.data.validUntil || null,
    };
  }

  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;
  const { error } = await supabase.from("pages").update(update).eq("slug", page.data);
  if (error) return { ok: false, message: "השמירה נכשלה" };
  revalidateSite();
  revalidatePath("/admin/pages");
  return { ok: true };
}
