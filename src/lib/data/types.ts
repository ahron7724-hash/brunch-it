import type { DietTag } from "@/lib/validation/content";

export type Image = { url: string; alt: string };

export type CategoryRef = { name: string; slug: string };

export type Category = CategoryRef & {
  id: string;
  description: string | null;
  imageUrl: string | null;
};

export type ProductSize = {
  id: string;
  label: string;
  price: number;
  serves: string | null;
};

export type ProductOption = {
  id: string;
  label: string;
  extraPrice: number;
};

export type ProductOptionGroup = {
  name: string;
  options: ProductOption[];
};

export type ProductSummary = {
  id: string;
  title: string;
  slug: string;
  image: Image | null;
  /** All images in display order (the first is `image`). */
  images: Image[];
  sizes: ProductSize[];
  minPrice: number;
  dietTags: DietTag[];
  /** null = use the site default lead time. */
  leadTimeHours: number | null;
  categories: CategoryRef[];
};

export type ProductDetail = ProductSummary & {
  description: string | null;
  contents: string | null;
  images: Image[];
  optionGroups: ProductOptionGroup[];
  allowsCustomText: boolean;
  customTextLabel: string | null;
};

export type Testimonial = {
  id: string;
  clientName: string;
  content: string;
  eventLabel: string | null;
  rating: number;
};

export type MediaItem = { id: string; url: string; alt: string };

export type HeroSlide = MediaItem & { mediaType: "image" | "video" };

export type GalleryImage = MediaItem & { caption: string | null };

export type ContentPage = {
  title: string;
  heroImageUrl: string | null;
  bodyText: string;
};

export type KashrutPage = ContentPage & {
  certificateUrl: string | null;
  supervision: string;
  validUntil: string | null;
};

export const DIET_LABELS: Record<DietTag, string> = {
  dairy: "חלבי",
  parve: "פרווה",
  gluten_free: "ללא גלוטן",
  vegan: "טבעוני",
};
