"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ORDER_STATUSES } from "@/lib/admin/orders";
import { adminClient, NOT_AUTHORIZED, type AdminActionResult } from "@/lib/auth/admin";

const idSchema = z.string().uuid();
const statusSchema = z.enum(ORDER_STATUSES);

export async function updateOrderStatus(orderId: string, status: string): Promise<AdminActionResult> {
  const id = idSchema.safeParse(orderId);
  const next = statusSchema.safeParse(status);
  if (!id.success || !next.success) return { ok: false, message: "בקשה לא תקינה" };

  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { error } = await supabase.from("orders").update({ status: next.data }).eq("id", id.data);
  if (error) return { ok: false, message: "לא הצלחנו לעדכן את הסטטוס" };

  revalidatePath("/admin", "layout");
  return { ok: true, message: "הסטטוס עודכן" };
}

export async function deleteOrder(orderId: string): Promise<AdminActionResult> {
  const id = idSchema.safeParse(orderId);
  if (!id.success) return { ok: false, message: "בקשה לא תקינה" };

  const supabase = await adminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { error } = await supabase.from("orders").delete().eq("id", id.data);
  if (error) return { ok: false, message: "לא הצלחנו למחוק את ההזמנה" };

  revalidatePath("/admin", "layout");
  redirect("/admin");
}
