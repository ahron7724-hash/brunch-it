import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { imageUrlSchema, parseRows } from "@/lib/validation/content";

const money = z.coerce.number();

const traySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  image_url: imageUrlSchema.nullable().catch(null),
  min_lead_time_hours: z.number().int().nullable(),
  is_active: z.boolean(),
  sort_order: z.number().int(),
  tray_images: z.array(z.object({ id: z.string().uuid(), url: imageUrlSchema, alt: z.string().nullable(), sort_order: z.number().int() })).catch([]),
  tray_sizes: z.array(z.object({ id: z.string().uuid(), label: z.string(), capacity: z.number().int().nullable(), sort_order: z.number().int() })).catch([]),
  tray_items: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        price: money,
        image_url: imageUrlSchema.nullable().catch(null),
        is_active: z.boolean(),
        sort_order: z.number().int(),
      })
    )
    .catch([]),
});

export type AdminTray = z.infer<typeof traySchema>;

const COLUMNS =
  "id, title, slug, description, image_url, min_lead_time_hours, is_active, sort_order, tray_images(id, url, alt, sort_order), tray_sizes(id, label, capacity, sort_order), tray_items(id, name, price, image_url, is_active, sort_order)";

function sorted(tray: AdminTray): AdminTray {
  const bySort = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order;
  return {
    ...tray,
    tray_images: [...tray.tray_images].sort(bySort),
    tray_sizes: [...tray.tray_sizes].sort(bySort),
    tray_items: [...tray.tray_items].sort(bySort),
  };
}

export async function listAdminTrays(): Promise<AdminTray[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("trays").select(COLUMNS).order("sort_order").order("created_at");
  if (error) return [];
  return parseRows(traySchema, data).map(sorted);
}

export async function getAdminTray(id: string): Promise<AdminTray | null> {
  if (!z.string().uuid().safeParse(id).success) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("trays").select(COLUMNS).eq("id", id).maybeSingle();
  const parsed = traySchema.safeParse(data);
  return parsed.success ? sorted(parsed.data) : null;
}
