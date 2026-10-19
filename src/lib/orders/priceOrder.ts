import "server-only";

import { z } from "zod";

import { TRAY_MAX_SINGLES } from "@/lib/data/types";
import { createPublicClient } from "@/lib/supabase/public";
import { parseRows } from "@/lib/validation/content";
import type { OrderItemInput } from "@/lib/validation/order";

export type PricedLine = {
  /** null for a tray (trays aren't products and have no recipe). */
  productId: string | null;
  title: string;
  /** product_sizes id; null for a tray. */
  sizeId: string | null;
  sizeLabel: string;
  /** Units in one package of this size (for recipes and stock). */
  unitCount: number;
  options: { id?: string; group: string; label: string; extraPrice: number }[];
  customText: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  leadTimeHours: number | null;
};

const price = z.coerce.number().nonnegative();

const productSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  min_lead_time_hours: z.number().int().nullable(),
  allows_custom_text: z.boolean(),
  product_sizes: z.array(z.object({ id: z.string().uuid(), label: z.string(), price, unit_count: z.number().int().positive().catch(1) })),
  product_options: z.array(
    z.object({ id: z.string().uuid(), group_name: z.string(), label: z.string(), extra_price: price, is_active: z.boolean() })
  ),
});

const traySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  min_lead_time_hours: z.number().int().nullable(),
  tray_sizes: z.array(z.object({ id: z.string().uuid(), label: z.string(), capacity: z.number().int().positive().nullable() })),
  tray_items: z.array(z.object({ id: z.string().uuid(), name: z.string(), price, is_active: z.boolean() })),
});

/**
 * Prices cart lines from the database. Anything that no longer exists, is inactive,
 * or doesn't belong to its product is rejected with a message the customer can act on.
 */
export async function priceOrder(items: OrderItemInput[]): Promise<{ lines: PricedLine[] } | { error: string }> {
  const supabase = createPublicClient();
  if (!supabase) return { error: "השירות אינו זמין כרגע. נסו שוב מאוחר יותר." };

  const productIds = [...new Set(items.filter((i) => i.kind === "product").map((i) => i.productId))];
  const trayIds = [...new Set(items.filter((i) => i.kind === "tray").map((i) => i.productId))];
  const [productResult, trayResult] = await Promise.all([
    productIds.length === 0
      ? { data: [], error: null }
      : supabase
          .from("products")
          .select("id, title, min_lead_time_hours, allows_custom_text, product_sizes(id, label, price, unit_count), product_options(id, group_name, label, extra_price, is_active)")
          .eq("is_active", true)
          .in("id", productIds),
    trayIds.length === 0
      ? { data: [], error: null }
      : supabase
          .from("trays")
          .select("id, title, min_lead_time_hours, tray_sizes(id, label, capacity), tray_items(id, name, price, is_active)")
          .eq("is_active", true)
          .in("id", trayIds),
  ]);

  if (productResult.error || trayResult.error) return { error: "לא הצלחנו לבדוק את המוצרים. נסו שוב בעוד רגע." };
  const products = new Map(parseRows(productSchema, productResult.data).map((p) => [p.id, p]));
  const trays = new Map(parseRows(traySchema, trayResult.data).map((t) => [t.id, t]));

  const lines: PricedLine[] = [];
  for (const item of items) {
    if (item.kind === "tray") {
      const line = priceTray(item, trays.get(item.productId));
      if ("error" in line) return line;
      lines.push(line);
      continue;
    }

    const product = products.get(item.productId);
    if (!product) return { error: "אחד המוצרים בסל כבר אינו זמין. נא להסיר אותו ולנסות שוב." };

    const size = product.product_sizes.find((s) => s.id === item.sizeId);
    if (!size) return { error: `הגודל שנבחר עבור "${product.title}" השתנה. נא להוסיף את המוצר לסל מחדש.` };

    const options = item.optionIds.map((id) => product.product_options.find((o) => o.id === id && o.is_active));
    if (options.some((o) => o === undefined)) {
      return { error: `אחת האפשרויות שנבחרו עבור "${product.title}" השתנתה. נא להוסיף את המוצר לסל מחדש.` };
    }
    const chosen = options.flatMap((o) => (o ? [{ id: o.id, group: o.group_name, label: o.label, extraPrice: o.extra_price }] : []));

    const unitPrice = size.price + chosen.reduce((sum, o) => sum + o.extraPrice, 0);
    lines.push({
      productId: product.id,
      title: product.title,
      sizeId: size.id,
      sizeLabel: size.label,
      unitCount: size.unit_count,
      options: chosen,
      customText: product.allows_custom_text && item.customText ? item.customText : null,
      unitPrice,
      quantity: item.quantity,
      lineTotal: unitPrice * item.quantity,
      leadTimeHours: product.min_lead_time_hours,
    });
  }
  return { lines };
}

/** A filled tray: every unit priced from the database, and the tray must be exactly full. */
function priceTray(item: OrderItemInput, tray: z.infer<typeof traySchema> | undefined): PricedLine | { error: string } {
  if (!tray) return { error: "אחד המגשים בסל כבר אינו זמין. נא להסיר אותו ולנסות שוב." };
  const changed = { error: `המגש "${tray.title}" השתנה. נא להסיר אותו מהסל ולמלא מחדש.` };

  const size = tray.tray_sizes.find((s) => s.id === item.sizeId);
  if (!size) return changed;

  const counts = new Map<string, number>();
  for (const entry of item.trayItems) counts.set(entry.id, (counts.get(entry.id) ?? 0) + entry.quantity);

  const contents: { name: string; quantity: number; price: number }[] = [];
  for (const [id, quantity] of counts) {
    const trayItem = tray.tray_items.find((i) => i.id === id && i.is_active);
    if (!trayItem) return changed;
    contents.push({ name: trayItem.name, quantity, price: trayItem.price });
  }

  const units = contents.reduce((sum, c) => sum + c.quantity, 0);
  if (units === 0 || (size.capacity !== null ? units !== size.capacity : units > TRAY_MAX_SINGLES)) return changed;

  const unitPrice = contents.reduce((sum, c) => sum + c.price * c.quantity, 0);
  return {
    productId: null,
    title: tray.title,
    sizeId: null,
    sizeLabel: size.label,
    unitCount: units,
    options: [{ group: "תכולה", label: contents.map((c) => `${c.name} × ${c.quantity}`).join(", "), extraPrice: 0 }],
    customText: null,
    unitPrice,
    quantity: item.quantity,
    lineTotal: unitPrice * item.quantity,
    leadTimeHours: tray.min_lead_time_hours,
  };
}
