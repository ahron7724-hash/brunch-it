/**
 * Site-wide settings the owner edits in the admin panel ("עיצוב וטקסטים", "פרטי העסק").
 * Stored in the `site_settings` table; these defaults are used until the table has a row
 * (and as a fallback if Supabase is unreachable).
 */

export const FONT_KEYS = ["assistant", "heebo", "noto", "plex"] as const;
export type FontKey = (typeof FONT_KEYS)[number];

export type SiteColors = {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
};

export type SiteSettings = {
  businessName: string;
  tagline: string;
  logoUrl: string | null;
  colors: SiteColors;
  font: FontKey;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  /** Home page only: the header stays hidden over the hero until the visitor scrolls. */
  headerOnScroll: boolean;
  phone: string;
  whatsapp: string;
  orderEmail: string;
  pickupAddress: string;
  pickupMapUrl: string;
  kashrutLine: string;
  defaultLeadTimeHours: number;
  deliveryEnabled: boolean;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  businessName: "Brunch it",
  tagline: "BOUTIQUE PATISSERIE",
  logoUrl: null,
  colors: {
    primary: "#1E1C1A",
    accent: "#B0916A",
    background: "#FFFFFF",
    surface: "#F7F5F2",
    text: "#1E1C1A",
  },
  font: "assistant",
  heroEyebrow: "הזמנות מראש בלבד",
  heroTitle: "עוגות מעוצבות לרגעים שזוכרים",
  heroSubtitle:
    "עבודת יד בכמויות קטנות, מחומרי גלם מובחרים. מזמינים מראש ואוספים טרי ביום האירוע.",
  headerOnScroll: true,
  phone: "",
  whatsapp: "",
  orderEmail: "",
  pickupAddress: "",
  pickupMapUrl: "",
  kashrutLine: "",
  defaultLeadTimeHours: 48,
  deliveryEnabled: true,
};
