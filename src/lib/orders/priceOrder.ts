import "server-only";

import { z } from "zod";

import { createPublicClient } from "@/lib/supabase/public";
import { parseRows } from "@/lib/validation/content";
import type { OrderItemInput } from "@/lib/validation/order";

export type PricedLine = {
  productId: string;
  title: string;
  sizeId: string;
  sizeLabel: string;
  /** Units in one package of this size (for recipes and stock). */
  unitCount: number;
  options: { id: string; group: string; label: string; extraPrice: number }[];
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

/**
 * Prices cart lines from the database. Anything that no longer exists, is inactive,
 * or doesn't belong to its product is rejected with a message the customer can act on.
 */
export async function priceOrder(items: OrderItemInput[]): Promise<{ lines: PricedLine[] } | { error: string }> {
  const supabase = createPublicClient();
  if (!supabase) return { error: "השירות אינו זמין כרגע. נסו שוב מאוחר יותר." };

  const ids = [...new Set(items.map((i) => i.productId))];
  const { data, error } = await supabase
    .from("products")
    .select("id, title, min_lead_time_hours, allows_custom_text, product_sizes(id, label, price, unit_count), product_options(id, group_name, label, extra_price, is_active)")
    .eq("is_active", true)
    .in("id", ids);

  if (error) return { error: "לא הצלחנו לבדוק את המוצרים. נסו שוב בעוד רגע." };
  const products = new Map(parseRows(productSchema, data).map((p) => [p.id, p]));

  const lines: PricedLine[] = [];
  for (const item of items) {
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
