import "server-only";

import { cache } from "react";
import type { z } from "zod";

import { createPublicClient } from "@/lib/supabase/public";
import { categoryRowSchema, parseRows, productRowSchema, type DietTag } from "@/lib/validation/content";

import type { Category, ProductDetail, ProductOptionGroup, ProductSummary } from "./types";

type ProductRow = z.infer<typeof productRowSchema>;

const PRODUCT_COLUMNS = `
  id, title, slug, description, contents, min_lead_time_hours, diet_tags,
  allows_custom_text, custom_text_label, is_featured, sort_order,
  product_images ( url, alt, sort_order ),
  product_sizes ( id, label, price, serves, sort_order ),
  product_options ( id, group_name, label, extra_price, sort_order, is_active ),
  product_categories ( categories ( name, slug ) )
`;

export type ProductSort = "default" | "price-asc" | "price-desc";

export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url")
    .eq("is_active", true)
    .order("sort_order");

  if (error) return [];
  return parseRows(categoryRowSchema, data).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
  }));
});

export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
});

type ProductQuery = {
  categoryId?: string;
  featuredOnly?: boolean;
  diet?: DietTag;
  sort?: ProductSort;
  limit?: number;
};

export const getProducts = cache(async (query: ProductQuery = {}): Promise<ProductSummary[]> => {
  const supabase = createPublicClient();
  if (!supabase) return [];

  let request = supabase.from("products").select(PRODUCT_COLUMNS).eq("is_active", true).order("sort_order");

  if (query.categoryId) {
    const { data: links, error } = await supabase
      .from("product_categories")
      .select("product_id")
      .eq("category_id", query.categoryId);
    if (error) return [];
    const ids = (links ?? []).map((l: { product_id: string }) => l.product_id);
    if (ids.length === 0) return [];
    request = request.in("id", ids);
  }
  if (query.featuredOnly) request = request.eq("is_featured", true);
  if (query.diet) request = request.contains("diet_tags", [query.diet]);
  if (query.limit) request = request.limit(query.limit);

  const { data, error } = await request;
  if (error) return [];

  const products = parseRows(productRowSchema, data)
    .map(toSummary)
    .filter((p) => p.sizes.length > 0); // a product without a price can't be ordered

  return sortProducts(products, query.sort ?? "default");
});

export const getProductBySlug = cache(async (slug: string): Promise<ProductDetail | null> => loadProduct("slug", slug));

export const getProductById = cache(async (id: string): Promise<ProductDetail | null> => loadProduct("id", id));

async function loadProduct(column: "slug" | "id", value: string): Promise<ProductDetail | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_active", true)
    .eq(column, value)
    .maybeSingle();

  if (error || !data) return null;
  const parsed = productRowSchema.safeParse(data);
  if (!parsed.success) return null;

  const summary = toSummary(parsed.data);
  if (summary.sizes.length === 0) return null;

  return {
    ...summary,
    description: parsed.data.description,
    contents: parsed.data.contents,
    images: bySortOrder(parsed.data.product_images).map((img) => ({
      url: img.url,
      alt: img.alt ?? parsed.data.title,
    })),
    optionGroups: groupOptions(parsed.data),
    allowsCustomText: parsed.data.allows_custom_text,
    customTextLabel: parsed.data.custom_text_label,
  };
}

export const getAllProductSlugs = cache(async (): Promise<string[]> => {
  const products = await getProducts();
  return products.map((p) => p.slug);
});

function toSummary(row: ProductRow): ProductSummary {
  const sizes = bySortOrder(row.product_sizes).map((s) => ({
    id: s.id,
    label: s.label,
    price: s.price,
    serves: s.serves,
  }));
  const images = bySortOrder(row.product_images).map((img) => ({ url: img.url, alt: img.alt ?? row.title }));
  const firstImage = images[0];

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    image: firstImage ?? null,
    images,
    sizes,
    minPrice: sizes.length > 0 ? Math.min(...sizes.map((s) => s.price)) : 0,
    dietTags: row.diet_tags,
    leadTimeHours: row.min_lead_time_hours,
    categories: row.product_categories.flatMap((link) => (link.categories ? [link.categories] : [])),
  };
}

function groupOptions(row: ProductRow): ProductOptionGroup[] {
  const groups = new Map<string, ProductOptionGroup>();
  for (const option of bySortOrder(row.product_options)) {
    if (!option.is_active) continue;
    const group = groups.get(option.group_name) ?? { name: option.group_name, options: [] };
    groups.set(option.group_name, {
      ...group,
      options: [...group.options, { id: option.id, label: option.label, extraPrice: option.extra_price }],
    });
  }
  return [...groups.values()];
}

function bySortOrder<T extends { sort_order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}

function sortProducts(products: ProductSummary[], sort: ProductSort): ProductSummary[] {
  if (sort === "price-asc") return [...products].sort((a, b) => a.minPrice - b.minPrice);
  if (sort === "price-desc") return [...products].sort((a, b) => b.minPrice - a.minPrice);
  return products;
}
