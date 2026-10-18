import "server-only";

import { z } from "zod";

import { israelToday } from "@/lib/booking/time";
import { createClient } from "@/lib/supabase/server";
import { parseRows } from "@/lib/validation/content";

export const ORDER_STATUSES = ["new", "confirmed", "ready", "collected", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "חדשה",
  confirmed: "אושרה",
  ready: "מוכנה",
  collected: "נאספה / נמסרה",
  cancelled: "בוטלה",
};

const money = z.coerce.number();
const time = z.string().transform((t) => t.slice(0, 5));

const orderRowSchema = z.object({
  id: z.string().uuid(),
  order_number: z.number().int(),
  status: z.enum(ORDER_STATUSES),
  customer_name: z.string(),
  customer_phone: z.string(),
  customer_email: z.string(),
  notes: z.string().nullable(),
  pickup_date: z.string(),
  slot_start: time,
  slot_end: time,
  fulfillment: z.enum(["pickup", "delivery"]),
  delivery_zone_name: z.string().nullable(),
  delivery_address: z.string().nullable(),
  delivery_fee: money,
  subtotal: money,
  total: money,
  created_at: z.string(),
});

const itemRowSchema = z.object({
  id: z.string().uuid(),
  product_title: z.string(),
  size_label: z.string(),
  unit_price: money,
  quantity: z.number().int(),
  custom_text: z.string().nullable(),
  options: z.array(z.object({ group: z.string(), label: z.string() }).passthrough()).catch([]),
  line_total: money,
});

export type AdminOrder = z.infer<typeof orderRowSchema>;
export type AdminOrderItem = z.infer<typeof itemRowSchema>;

const COLUMNS =
  "id, order_number, status, customer_name, customer_phone, customer_email, notes, pickup_date, slot_start, slot_end, fulfillment, delivery_zone_name, delivery_address, delivery_fee, subtotal, total, created_at";

export type OrderScope = "upcoming" | "past" | "all";

/** Orders visible to the signed-in admin (RLS), ordered by pickup date and slot. */
export async function listOrders(scope: OrderScope): Promise<AdminOrder[]> {
  const supabase = await createClient();
  const today = israelToday();
  let query = supabase.from("orders").select(COLUMNS).limit(500);
  if (scope === "upcoming") query = query.gte("pickup_date", today).order("pickup_date").order("slot_start");
  else if (scope === "past") query = query.lt("pickup_date", today).order("pickup_date", { ascending: false });
  else query = query.order("pickup_date", { ascending: false }).order("slot_start");

  const { data, error } = await query;
  if (error) return [];
  return parseRows(orderRowSchema, data);
}

export async function getOrder(id: string): Promise<{ order: AdminOrder; items: AdminOrderItem[] } | null> {
  if (!z.string().uuid().safeParse(id).success) return null;
  const supabase = await createClient();
  const [orderRes, itemsRes] = await Promise.all([
    supabase.from("orders").select(COLUMNS).eq("id", id).maybeSingle(),
    supabase.from("order_items").select("id, product_title, size_label, unit_price, quantity, custom_text, options, line_total").eq("order_id", id),
  ]);
  const order = orderRowSchema.safeParse(orderRes.data);
  if (!order.success) return null;
  return { order: order.data, items: parseRows(itemRowSchema, itemsRes.data) };
}
