import "server-only";

import { cache } from "react";
import { z } from "zod";

import { createPublicClient } from "@/lib/supabase/public";
import { parseRows } from "@/lib/validation/content";

export type DeliveryZone = { id: string; name: string; price: number; minOrder: number };

const zoneRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(80),
  price: z.coerce.number().nonnegative(),
  min_order: z.coerce.number().nonnegative(),
});

export const getDeliveryZones = cache(async (): Promise<DeliveryZone[]> => {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("id, name, price, min_order")
    .eq("is_active", true)
    .order("sort_order");
  if (error) return [];
  return parseRows(zoneRowSchema, data).map((r) => ({ id: r.id, name: r.name, price: r.price, minOrder: r.min_order }));
});
