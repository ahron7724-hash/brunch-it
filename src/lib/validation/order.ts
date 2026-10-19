import { z } from "zod";

// Checkout input. Used for friendly checks in the browser, and authoritatively on the server.
// Prices are deliberately NOT part of the input: the server prices every order from the database.

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "תאריך לא תקין");
const time = z.string().regex(/^\d{2}:\d{2}$/, "שעה לא תקינה");

/** Israeli phone: keeps digits (and a leading +), accepts 05X…, 0X…, +972… */
export const phoneSchema = z
  .string()
  .trim()
  .max(20, "מספר טלפון ארוך מדי")
  .transform((v) => v.replace(/[^\d+]/g, ""))
  .pipe(z.string().regex(/^(?:\+972|0)\d{8,9}$/, "מספר טלפון לא תקין"));

export const orderItemInputSchema = z.object({
  productId: z.string().uuid(),
  sizeId: z.string().uuid(),
  optionIds: z.array(z.string().uuid()).max(20).default([]),
  quantity: z.number().int().min(1).max(99),
  customText: z.string().trim().max(200).optional(),
  /** "tray": productId is a tray id, sizeId a tray-size id, and trayItems its contents. */
  kind: z.enum(["product", "tray"]).default("product"),
  trayItems: z.array(z.object({ id: z.string().uuid(), quantity: z.number().int().min(1).max(200) })).max(50).default([]),
});

export type OrderItemInput = z.infer<typeof orderItemInputSchema>;

export const checkoutSchema = z
  .object({
    customerName: z.string().trim().min(2, "נא למלא שם מלא").max(80, "השם ארוך מדי"),
    customerPhone: phoneSchema,
    customerEmail: z.string().trim().email("כתובת דוא״ל לא תקינה").max(254),
    notes: z.string().trim().max(1000, "ההערות ארוכות מדי").optional(),
    fulfillment: z.enum(["pickup", "delivery"]),
    deliveryZoneId: z.string().uuid().optional(),
    deliveryAddress: z.string().trim().max(300, "הכתובת ארוכה מדי").optional(),
    pickupDate: isoDate,
    slotStart: time,
    slotEnd: time,
    items: z.array(orderItemInputSchema).min(1, "הסל ריק").max(50),
    // Honeypot: hidden from people, bots fill it in.
    website: z.string().max(0).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.fulfillment !== "delivery") return;
    if (!value.deliveryZoneId) {
      ctx.addIssue({ code: "custom", path: ["deliveryZoneId"], message: "נא לבחור אזור משלוח" });
    }
    if (!value.deliveryAddress || value.deliveryAddress.length < 5) {
      ctx.addIssue({ code: "custom", path: ["deliveryAddress"], message: "נא למלא כתובת למשלוח" });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export type CheckoutField = "customerName" | "customerPhone" | "customerEmail" | "notes" | "deliveryZoneId" | "deliveryAddress";

export type CheckoutState = {
  ok: boolean;
  message?: string;
  errors?: Partial<Record<CheckoutField, string>>;
  /** What the customer typed, sent back so a failed submit doesn't clear the form. */
  values?: Partial<Record<CheckoutField, string>>;
  orderNumber?: number;
};
