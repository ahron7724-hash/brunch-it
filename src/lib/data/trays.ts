import "server-only";

import { cache } from "react";
import type { z } from "zod";

import { createPublicClient } from "@/lib/supabase/public";
import { parseRows, trayRowSchema } from "@/lib/validation/content";

import type { Tray } from "./types";

const TRAY_COLUMNS = `
  id, title, slug, description, image_url, min_lead_time_hours, sort_order,
  tray_images ( url, alt, sort_order ),
  tray_sizes ( id, label, capacity, sort_order ),
  tray_items ( id, name, price, image_url, is_active, sort_order )
`;

/** Active trays that can be ordered (at least one size and one item). */
export const getTrays = cache(async (): Promise<Tray[]> => {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from("trays").select(TRAY_COLUMNS).eq("is_active", true).order("sort_order");
  if (error) return [];
  return parseRows(trayRowSchema, data).map(toTray).filter(isOrderable);
});

export const getTrayBySlug = cache(async (slug: string): Promise<Tray | null> => {
  const trays = await getTrays();
  return trays.find((t) => t.slug === slug) ?? null;
});

function toTray(row: z.infer<typeof trayRowSchema>): Tray {
  const items = bySortOrder(row.tray_items)
    .filter((i) => i.is_active)
    .map((i) => ({ id: i.id, name: i.name, price: i.price, imageUrl: i.image_url }));

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
    heroImages: bySortOrder(row.tray_images).map((img) => ({ url: img.url, alt: img.alt ?? row.title })),
    leadTimeHours: row.min_lead_time_hours,
    sizes: bySortOrder(row.tray_sizes).map((s) => ({ id: s.id, label: s.label, capacity: s.capacity })),
    items,
    minUnitPrice: items.length > 0 ? Math.min(...items.map((i) => i.price)) : 0,
  };
}

function isOrderable(tray: Tray): boolean {
  return tray.sizes.length > 0 && tray.items.length > 0;
}

function bySortOrder<T extends { sort_order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}
