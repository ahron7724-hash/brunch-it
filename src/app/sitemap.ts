import type { MetadataRoute } from "next";

import { getAllProductSlugs, getCategories } from "@/lib/data/catalog";
import { getTrays } from "@/lib/data/trays";

const STATIC_PATHS = ["/", "/catalog", "/about", "/kashrut", "/accessibility", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
  const [categories, productSlugs, trays] = await Promise.all([getCategories(), getAllProductSlugs(), getTrays()]);

  const paths = [
    ...STATIC_PATHS,
    ...categories.map((c) => `/category/${encodeURIComponent(c.slug)}`),
    ...productSlugs.map((slug) => `/product/${encodeURIComponent(slug)}`),
    ...trays.map((t) => `/tray/${encodeURIComponent(t.slug)}`),
  ];

  return paths.map((path) => ({ url: new URL(path, base).href }));
}
