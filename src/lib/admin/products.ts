import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { DIET_TAGS, imageUrlSchema, parseRows } from "@/lib/validation/content";

const money = z.coerce.number();

const listRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  sort_order: z.number().int(),
  product_images: z.array(z.object({ url: imageUrlSchema, sort_order: z.number() })).catch([]),
  product_sizes: z.array(z.object({ price: money })).catch([]),
  product_categories: z.array(z.object({ categories: z.object({ name: z.string() }).nullable() })).catch([]),
});

export type AdminProductRow = {
  id: string;
  title: string;
  slug: string;
  isActive: boolean;
  isFeatured: boolean;
  /** All product images, first = catalog image (up to 3). */
  imageUrls: string[];
  priceRange: [number, number] | null;
  categories: string[];
};

export async function listAdminProducts(): Promise<AdminProductRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, title, slug, is_active, is_featured, sort_order, product_images(url, sort_order), product_sizes(price), product_categories(categories(name))")
    .order("sort_order")
    .order("created_at");
  if (error) return [];
  return parseRows(listRowSchema, data).map((row) => {
    const prices = row.product_sizes.map((s) => s.price);
    const images = [...row.product_images].sort((a, b) => a.sort_order - b.sort_order);
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      isActive: row.is_active,
      isFeatured: row.is_featured,
      imageUrls: images.map((img) => img.url),
      priceRange: prices.length > 0 ? [Math.min(...prices), Math.max(...prices)] : null,
      categories: row.product_categories.flatMap((c) => (c.categories ? [c.categories.name] : [])),
    };
  });
}

const detailSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  contents: z.string().nullable(),
  min_lead_time_hours: z.number().int().nullable(),
  diet_tags: z.array(z.enum(DIET_TAGS)).catch([]),
  allows_custom_text: z.boolean(),
  custom_text_label: z.string().nullable(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  sort_order: z.number().int(),
  product_images: z.array(z.object({ id: z.string().uuid(), url: imageUrlSchema, alt: z.string().nullable(), sort_order: z.number().int() })),
  product_sizes: z.array(z.object({ id: z.string().uuid(), label: z.string(), price: money, unit_count: z.number().int(), serves: z.string().nullable(), sort_order: z.number().int() })),
  product_options: z.array(
    z.object({ id: z.string().uuid(), group_name: z.string(), label: z.string(), extra_price: money, sort_order: z.number().int(), is_active: z.boolean() })
  ),
  product_categories: z.array(z.object({ category_id: z.string().uuid() })),
});

export type AdminProduct = z.infer<typeof detailSchema>;

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
  if (!z.string().uuid().safeParse(id).success) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(
      "id, title, slug, description, contents, min_lead_time_hours, diet_tags, allows_custom_text, custom_text_label, is_active, is_featured, sort_order, product_images(id, url, alt, sort_order), product_sizes(id, label, price, unit_count, serves, sort_order), product_options(id, group_name, label, extra_price, sort_order, is_active), product_categories(category_id)"
    )
    .eq("id", id)
    .maybeSingle();
  const parsed = detailSchema.safeParse(data);
  if (!parsed.success) return null;
  const bySort = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order;
  return {
    ...parsed.data,
    product_images: [...parsed.data.product_images].sort(bySort),
    product_sizes: [...parsed.data.product_sizes].sort(bySort),
    product_options: [...parsed.data.product_options].sort(bySort),
  };
}

const categoryRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  image_url: imageUrlSchema.nullable().catch(null),
  sort_order: z.number().int(),
  is_active: z.boolean(),
});

export type AdminCategory = z.infer<typeof categoryRowSchema>;

export async function listAdminCategories(): Promise<AdminCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url, sort_order, is_active")
    .order("sort_order")
    .order("name");
  if (error) return [];
  return parseRows(categoryRowSchema, data);
}
