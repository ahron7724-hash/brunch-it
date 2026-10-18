import "server-only";

import { cache } from "react";

import { createPublicClient } from "@/lib/supabase/public";
import {
  galleryImageRowSchema,
  heroSlideRowSchema,
  kashrutExtraSchema,
  pageRowSchema,
  parseRows,
  stripImageRowSchema,
  testimonialRowSchema,
} from "@/lib/validation/content";

import type { ContentPage, GalleryImage, HeroSlide, KashrutPage, MediaItem, Testimonial } from "./types";

export const getHeroSlides = cache(async (): Promise<HeroSlide[]> => {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("hero_slides")
    .select("id, url, alt, media_type")
    .eq("is_active", true)
    .order("sort_order")
    .limit(10);
  if (error) return [];
  return parseRows(heroSlideRowSchema, data).map((row) => ({
    id: row.id,
    url: row.url,
    alt: row.alt ?? "",
    mediaType: row.media_type,
  }));
});

export const getStripImages = cache(async (): Promise<{ top: MediaItem[]; bottom: MediaItem[] }> => {
  const supabase = createPublicClient();
  if (!supabase) return { top: [], bottom: [] };
  const { data, error } = await supabase
    .from("strip_images")
    .select("id, url, alt, strip")
    .eq("is_active", true)
    .order("sort_order");
  if (error) return { top: [], bottom: [] };
  const rows = parseRows(stripImageRowSchema, data);
  const toItem = (row: (typeof rows)[number]): MediaItem => ({ id: row.id, url: row.url, alt: row.alt ?? "" });
  return {
    top: rows.filter((r) => r.strip === "top").map(toItem),
    bottom: rows.filter((r) => r.strip === "bottom").map(toItem),
  };
});

export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("testimonials")
    .select("id, client_name, content, event_label, rating, image_url")
    .eq("is_published", true)
    .order("sort_order");
  if (error) return [];
  return parseRows(testimonialRowSchema, data).map((row) => ({
    id: row.id,
    clientName: row.client_name,
    content: row.content,
    eventLabel: row.event_label,
    rating: row.rating,
  }));
});

export const getGalleryImages = cache(async (): Promise<GalleryImage[]> => {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("gallery_images").select("id, url, alt, caption").order("sort_order");
  if (error) return [];
  return parseRows(galleryImageRowSchema, data).map((row) => ({
    id: row.id,
    url: row.url,
    alt: row.alt ?? row.caption ?? "",
    caption: row.caption,
  }));
});

const fetchPage = cache(async (slug: "about" | "kashrut") => {
  const supabase = createPublicClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("pages")
    .select("slug, title, hero_image_url, body_text, extra")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  const parsed = pageRowSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
});

export async function getAboutPage(): Promise<ContentPage | null> {
  const row = await fetchPage("about");
  if (!row) return null;
  return { title: row.title, heroImageUrl: row.hero_image_url, bodyText: row.body_text };
}

export async function getKashrutPage(): Promise<KashrutPage | null> {
  const row = await fetchPage("kashrut");
  if (!row) return null;
  const extra = kashrutExtraSchema.parse(row.extra);
  return {
    title: row.title,
    heroImageUrl: row.hero_image_url,
    bodyText: row.body_text,
    certificateUrl: extra.certificateUrl,
    supervision: extra.supervision,
    validUntil: extra.validUntil,
  };
}
