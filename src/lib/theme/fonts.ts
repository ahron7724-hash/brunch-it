import { Assistant, Heebo, IBM_Plex_Sans_Hebrew, Noto_Sans_Hebrew } from "next/font/google";

import type { FontKey } from "@/lib/settings/defaults";

// All four are declared so the owner can switch fonts from the admin panel.
// Only the default is preloaded; the browser downloads the others only if they are selected.

const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  variable: "--font-assistant",
  display: "swap",
});

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
  preload: false,
});

const noto = Noto_Sans_Hebrew({
  subsets: ["hebrew", "latin"],
  variable: "--font-noto",
  display: "swap",
  preload: false,
});

const plex = IBM_Plex_Sans_Hebrew({
  subsets: ["hebrew", "latin"],
  weight: ["200", "300", "400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
  preload: false,
});

export const fontVariables = [assistant, heebo, noto, plex].map((f) => f.variable).join(" ");

export const FONT_OPTIONS: Record<FontKey, { label: string; cssVar: string }> = {
  assistant: { label: "Assistant", cssVar: "var(--font-assistant)" },
  heebo: { label: "Heebo", cssVar: "var(--font-heebo)" },
  noto: { label: "Noto Sans Hebrew", cssVar: "var(--font-noto)" },
  plex: { label: "IBM Plex Sans Hebrew", cssVar: "var(--font-plex)" },
};
