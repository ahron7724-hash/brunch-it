"use server";

import { z } from "zod";

import { getProductById } from "@/lib/data/catalog";
import type { ProductDetail } from "@/lib/data/types";

/** Product details for the quick-view window. Public data only (active products). */
export async function loadQuickView(productId: string): Promise<ProductDetail | null> {
  const id = z.string().uuid().safeParse(productId);
  if (!id.success) return null;
  return getProductById(id.data);
}
