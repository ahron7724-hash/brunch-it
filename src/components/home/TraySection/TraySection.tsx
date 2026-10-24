import { ArrowLeft } from "lucide-react";
import Image from "next/image";

import { ButtonLink } from "@/components/ui/Button/Button";
import type { Tray } from "@/lib/data/types";
import { formatPrice } from "@/lib/format";

import styles from "./TraySection.module.css";

type TraySectionProps = { trays: Tray[] };

/**
 * A section per build-your-own tray: a dark photo that stays still while the page scrolls over it,
 * with the pitch and call to action centered on it. (TrayStrip, a moving strip of the items, is kept for later.)
 */
export function TraySection({ trays }: TraySectionProps) {
  if (trays.length === 0) return null;

  return (
    <>
      {trays.map((tray) => {
        const titleId = `tray-${tray.id}-title`;
        const background = tray.heroImages[0]?.url ?? tray.imageUrl;
        const capacities = tray.sizes.flatMap((s) => (s.capacity ? [s.capacity] : []));
        const hasSingles = tray.sizes.some((s) => s.capacity === null);
        const sizesText = [capacities.length > 0 ? `${capacities.join(" · ")} יחידות` : null, hasSingles ? "או בודדים" : null]
          .filter(Boolean)
          .join(" ");

        return (
          <section key={tray.id} className={styles.section} aria-labelledby={titleId}>
            {background && (
              <div className={styles.media} aria-hidden="true">
                <Image src={background} alt="" fill sizes="100vw" className={styles.image} />
              </div>
            )}
            <div className={`container reveal ${styles.content}`}>
              <span className={styles.eyebrow}>מגש בהרכבה אישית</span>
              <h2 id={titleId} className={styles.title}>
                {tray.title}
              </h2>
              {tray.description && <p className={styles.description}>{tray.description}</p>}
              <p className={styles.meta}>
                {sizesText && <span>{sizesText}</span>}
                {tray.minUnitPrice > 0 && <span>החל מ־{formatPrice(tray.minUnitPrice)} ליחידה</span>}
              </p>
              <ButtonLink href={`/tray/${encodeURIComponent(tray.slug)}`} tone="onImage" className={styles.cta}>
                להרכבת המגש שלי
                <ArrowLeft size={18} strokeWidth={1.25} aria-hidden="true" className={styles.ctaIcon} />
              </ButtonLink>
            </div>
          </section>
        );
      })}
    </>
  );
}
