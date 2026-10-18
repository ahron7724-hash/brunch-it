"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { revalidateSite } from "@/lib/admin/revalidate";
import { saveSettingsPatch } from "@/lib/admin/settings";
import { adminClient, NOT_AUTHORIZED, type AdminActionResult } from "@/lib/auth/admin";
import { checkbox, uuid } from "@/lib/validation/admin";

const zoneSchema = z.object({
  id: uuid.optional(),
  name: z.string().trim().min(1, "לכל אזור צריך שם").max(80),
  price: z.coerce.number().nonnegative("מחיר לא תקין").max(10000),
  minOrder: z.coerce.number().nonnegative().max(100000),
});

function refresh() {
  revalidateSite();
  revalidatePath("/admin/delivery");
}

export async function saveDeliveryEnabled(_prev: AdminActionResult | null, formData: FormData): Promise<AdminActionResult> {
  const enabled = checkbox.safeParse(formData.get("deliveryEnabled"));
  if (!enabled.success) return { ok: false, message: "נתונים לא תקינים" };
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;
  if (!(await saveSettingsPatch(supabase, { deliveryEnabled: enabled.data }))) return { ok: false, message: "השמירה נכשלה" };
  refresh();
  return { ok: true };
}

export async function saveZones(rows: unknown): Promise<AdminActionResult> {
  const parsed = z.array(zoneSchema).max(30).safeParse(rows);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { data: existing, error: readError } = await supabase.from("delivery_zones").select("id");
  if (readError) return { ok: false, message: "השמירה נכשלה" };
  const keep = new Set(parsed.data.flatMap((z) => (z.id ? [z.id] : [])));
  const drop = (existing ?? []).map((r: { id: string }) => r.id).filter((id) => !keep.has(id));
  if (drop.length > 0) {
    // Past orders keep the zone name and fee they were placed with.
    const { error } = await supabase.from("delivery_zones").delete().in("id", drop);
    if (error) return { ok: false, message: "השמירה נכשלה" };
  }

  const ids: string[] = [];
  for (const [index, zone] of parsed.data.entries()) {
    const values = { name: zone.name, price: zone.price, min_order: zone.minOrder, sort_order: index, is_active: true };
    if (zone.id) {
      const { error } = await supabase.from("delivery_zones").update(values).eq("id", zone.id);
      if (error) return { ok: false, message: "השמירה נכשלה" };
      ids.push(zone.id);
    } else {
      const { data, error } = await supabase.from("delivery_zones").insert(values).select("id").single();
      if (error || !data) return { ok: false, message: "השמירה נכשלה" };
      ids.push(z.object({ id: z.string() }).parse(data).id);
    }
  }
  refresh();
  return { ok: true, message: "האזורים נשמרו", ids };
}
