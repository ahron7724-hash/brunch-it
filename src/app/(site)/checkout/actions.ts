"use server";

import { after } from "next/server";
import { z } from "zod";

import { isReadyBy } from "@/lib/booking/availability";
import { getBookingConfig } from "@/lib/data/booking";
import { getDeliveryZones } from "@/lib/data/delivery";
import { sendOrderEmails } from "@/lib/email/orderEmails";
import type { OrderSummary } from "@/lib/email/types";
import { priceOrder } from "@/lib/orders/priceOrder";
import { getPaymentProvider } from "@/lib/payment";
import { getSettings } from "@/lib/settings/get-settings";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { checkoutSchema, type CheckoutField, type CheckoutState } from "@/lib/validation/order";

const FIELDS: CheckoutField[] = ["customerName", "customerPhone", "customerEmail", "notes", "deliveryZoneId", "deliveryAddress"];
const GENERIC_ERROR = "לא הצלחנו לשלוח את ההזמנה. נסו שוב בעוד רגע, או צרו קשר טלפונית.";

export async function placeOrder(prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const result = await processOrder(prev, formData);
  return result.ok ? result : { ...result, values: submittedValues(formData) };
}

async function processOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  // 1. Validate input (the cart arrives as JSON in a hidden field).
  const parsed = checkoutSchema.safeParse({
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    customerEmail: formData.get("customerEmail"),
    notes: formData.get("notes") || undefined,
    fulfillment: formData.get("fulfillment"),
    deliveryZoneId: formData.get("deliveryZoneId") || undefined,
    deliveryAddress: formData.get("deliveryAddress") || undefined,
    pickupDate: formData.get("pickupDate"),
    slotStart: formData.get("slotStart"),
    slotEnd: formData.get("slotEnd"),
    items: parseJson(formData.get("cart")),
    website: formData.get("website") ?? undefined,
  });
  if (!parsed.success) return { ok: false, message: "נא לתקן את השדות המסומנים.", errors: fieldErrors(parsed.error) };
  const input = parsed.data;

  const [settings, booking, priced] = await Promise.all([getSettings(), getBookingConfig(), priceOrder(input.items)]);
  if ("error" in priced) return { ok: false, message: priced.error };

  // 2. Re-check the pickup slot and every product's preparation time on the server clock.
  const day = booking.days.find((d) => d.date === input.pickupDate);
  const slot = day?.slots.find((s) => s.start === input.slotStart && s.end === input.slotEnd);
  if (!day || day.closedReason || !slot) {
    return { ok: false, message: "מועד האיסוף שנבחר כבר אינו זמין. נא לבחור מועד אחר." };
  }
  const now = Date.now();
  const late = priced.lines.find((l) => !isReadyBy(l.leadTimeHours ?? booking.defaultLeadTimeHours, day.date, slot, now));
  if (late) return { ok: false, message: `"${late.title}" לא יספיק להיות מוכן למועד שנבחר. נא לבחור מועד מאוחר יותר.` };

  // 3. Products minimum (trays don't count), delivery zone and its minimum, from the database.
  const subtotal = priced.lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const productLines = priced.lines.filter((l) => l.productId !== null);
  const productsSubtotal = productLines.reduce((sum, l) => sum + l.lineTotal, 0);
  if (productLines.length > 0 && productsSubtotal < settings.productsMinOrder) {
    return { ok: false, message: `מינימום הזמנה למוצרים (לא כולל מגשים): ₪${settings.productsMinOrder}. נא להוסיף מוצרים להזמנה.` };
  }
  let deliveryFee = 0;
  let zoneName: string | null = null;
  if (input.fulfillment === "delivery") {
    const zone = settings.deliveryEnabled ? (await getDeliveryZones()).find((z) => z.id === input.deliveryZoneId) : undefined;
    if (!zone) return { ok: false, errors: { deliveryZoneId: "אזור המשלוח אינו זמין" } };
    if (subtotal < zone.minOrder) {
      return { ok: false, errors: { deliveryZoneId: `מינימום הזמנה למשלוח לאזור זה: ₪${zone.minOrder}` } };
    }
    deliveryFee = zone.price;
    zoneName = zone.name;
  }
  const total = subtotal + deliveryFee;

  // 4. Save order + items atomically (service role; customers can't write orders directly).
  const supabase = createServiceRoleClient();
  if (!supabase) return { ok: false, message: GENERIC_ERROR };
  const payment = getPaymentProvider();
  const { data, error } = await supabase.rpc("create_order", {
    p_order: {
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      customer_email: input.customerEmail,
      notes: input.notes ?? null,
      pickup_date: day.date,
      slot_start: slot.start,
      slot_end: slot.end,
      fulfillment: input.fulfillment,
      delivery_zone_id: input.fulfillment === "delivery" ? input.deliveryZoneId : null,
      delivery_zone_name: zoneName,
      delivery_address: input.fulfillment === "delivery" ? input.deliveryAddress : null,
      delivery_fee: deliveryFee,
      subtotal,
      total,
      payment_status: payment.initialStatus,
      payment_provider: payment.name,
    },
    p_items: priced.lines.map((l) => ({
      product_id: l.productId,
      product_title: l.title,
      size_id: l.sizeId,
      size_label: l.sizeLabel,
      unit_count: l.unitCount,
      unit_price: l.unitPrice,
      quantity: l.quantity,
      custom_text: l.customText,
      options: l.options,
      line_total: l.lineTotal,
    })),
  });
  const saved = z.object({ id: z.string().uuid(), order_number: z.number().int() }).safeParse(data);
  if (error || !saved.success) {
    console.error("create_order failed", error?.code ?? "invalid-response");
    return { ok: false, message: GENERIC_ERROR };
  }

  // 5. Payment (currently "none") and emails. Emails go out after the response is sent.
  const paymentResult = await payment.start({
    orderId: saved.data.id,
    orderNumber: saved.data.order_number,
    amount: total,
    customer: { name: input.customerName, email: input.customerEmail, phone: input.customerPhone },
  });
  if (paymentResult.kind === "failed") return { ok: false, message: paymentResult.message };

  const summary: OrderSummary = {
    orderNumber: saved.data.order_number,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
    notes: input.notes ?? null,
    pickupDate: day.date,
    slotStart: slot.start,
    slotEnd: slot.end,
    fulfillment: input.fulfillment,
    deliveryZoneName: zoneName,
    deliveryAddress: input.fulfillment === "delivery" ? (input.deliveryAddress ?? null) : null,
    deliveryFee,
    total,
    lines: priced.lines,
  };
  after(() => sendOrderEmails(summary, settings));

  return { ok: true, orderNumber: saved.data.order_number };
}

function parseJson(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string" || value.length > 50_000) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

const FIELD_NAMES = new Set<string>(FIELDS);

function submittedValues(formData: FormData): CheckoutState["values"] {
  const values: CheckoutState["values"] = {};
  for (const field of FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string") values[field] = value.slice(0, 1000);
  }
  return values;
}

function isField(value: unknown): value is CheckoutField {
  return typeof value === "string" && FIELD_NAMES.has(value);
}

function fieldErrors(error: z.ZodError): CheckoutState["errors"] {
  const errors: CheckoutState["errors"] = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (isField(field) && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}
