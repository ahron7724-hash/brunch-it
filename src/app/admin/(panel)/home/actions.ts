"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { revalidateSite } from "@/lib/admin/revalidate";
import { adminClient, NOT_AUTHORIZED, type AdminActionResult } from "@/lib/auth/admin";
import { checkbox, uuid } from "@/lib/validation/admin";

const testimonialSchema = z.object({
  clientName: z.string().trim().min(1, "נא למלא שם").max(80),
  eventLabel: z.string().trim().max(80),
  content: z.string().trim().min(1, "נא למלא את תוכן ההמלצה").max(1000),
  rating: z.coerce.number().int().min(1).max(5),
  sortOrder: z.coerce.number().int().min(0).max(10000),
  isPublished: checkbox,
});

function read(formData: FormData) {
  return testimonialSchema.safeParse({
    clientName: formData.get("clientName"),
    eventLabel: formData.get("eventLabel") ?? "",
    content: formData.get("content"),
    rating: formData.get("rating") || 5,
    sortOrder: formData.get("sortOrder") || 0,
    isPublished: formData.get("isPublished"),
  });
}

function toRow(d: z.infer<typeof testimonialSchema>) {
  return {
    client_name: d.clientName,
    event_label: d.eventLabel || null,
    content: d.content,
    rating: d.rating,
    sort_order: d.sortOrder,
    is_published: d.isPublished,
  };
}

function refresh() {
  revalidateSite();
  revalidatePath("/admin/home");
}

export async function createTestimonial(_prev: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> {
  const parsed = read(formData);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;
  const { error } = await supabase.from("testimonials").insert({ ...toRow(parsed.data), is_published: true });
  if (error) return { ok: false, message: "השמירה נכשלה" };
  refresh();
  return { ok: true, message: "ההמלצה נוספה" };
}

export async function updateTestimonial(testimonialId: string, _prev: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> {
  const id = uuid.safeParse(testimonialId);
  const parsed = read(formData);
  if (!id.success || !parsed.success) return { ok: false, message: parsed.error?.issues[0]?.message ?? "נתונים לא תקינים" };
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;
  const { error } = await supabase.from("testimonials").update(toRow(parsed.data)).eq("id", id.data);
  if (error) return { ok: false, message: "השמירה נכשלה" };
  refresh();
  return { ok: true };
}

export async function deleteTestimonial(testimonialId: string): Promise<AdminActionResult> {
  const id = uuid.safeParse(testimonialId);
  if (!id.success) return { ok: false, message: "בקשה לא תקינה" };
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;
  const { error } = await supabase.from("testimonials").delete().eq("id", id.data);
  if (error) return { ok: false, message: "המחיקה נכשלה" };
  refresh();
  return { ok: true };
}
