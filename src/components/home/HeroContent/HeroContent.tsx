import { ButtonLink } from "@/components/ui/Button/Button";
import type { SiteSettings } from "@/lib/settings/defaults";

import styles from "./HeroContent.module.css";

type HeroContentProps = { settings: SiteSettings };

/** Text overlay of the home hero: owner-edited eyebrow, title, subtitle and two calls to action. */
export function HeroContent({ settings }: HeroContentProps) {
  return (
    <div className={styles.content}>
      {settings.heroEyebrow && <span className={styles.eyebrow}>{settings.heroEyebrow}</span>}
      <h1>{settings.heroTitle}</h1>
      {settings.heroSubtitle && <p className={styles.sub}>{settings.heroSubtitle}</p>}
      <div className={styles.actions}>
        <ButtonLink href="/catalog" tone="onImage">
          לקטלוג
        </ButtonLink>
        <ButtonLink href="/about" variant="line" tone="onImage">
          הזמנה בעיצוב אישי
        </ButtonLink>
      </div>
    </div>
  );
}
