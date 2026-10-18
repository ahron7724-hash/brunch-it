import type { CSSProperties } from "react";

import type { SiteSettings } from "@/lib/settings/defaults";

import { FONT_OPTIONS } from "./fonts";

type ThemeVariables = CSSProperties & Record<`--${string}`, string>;

/**
 * Turns the owner's saved colors and font into the --site-* CSS variables that
 * tokens.css derives everything else from. Settings are zod-validated (hex only)
 * before they reach here, so no free-form value is ever injected into CSS.
 */
export function themeStyle(settings: SiteSettings): ThemeVariables {
  const c = settings.colors;
  return {
    "--site-primary": c.primary,
    "--site-accent": c.accent,
    "--site-bg": c.background,
    "--site-surface": c.surface,
    "--site-text": c.text,
    "--site-font": FONT_OPTIONS[settings.font].cssVar,
  };
}
