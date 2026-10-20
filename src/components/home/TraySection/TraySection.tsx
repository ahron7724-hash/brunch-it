import clsx from "clsx";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

import { ButtonLink } from "@/components/ui/Button/Button";
import type { Tray } from "@/lib/data/types";
import { formatPrice } from "@/lib/format";

import styles from "./TraySection.module.css";

type TraySectionProps = { trays: Tray[] };

/** A full section per build-your-own tray: large photo, short pitch, and call to action. (TrayStrip, a moving strip of its items, is ready to add back below it.) */
export function TraySection({ trays }: TraySectionProps) {
  if (trays.length === 0) return null;

  return (
    <>
      {trays.map((tray, index) => {
        const titleId = `tray-${tray.id}-title`;
        const capacities = tray.sizes.flatMap((s) => (s.capacity ? [s.capacity] : []));
        const hasSingles = tray.sizes.some((s) => s.capacity === null);

        return (
          <section key={tray.id} className={styles.section} aria-labelledby={titleId}>
            <div className={clsx("container", "reveal", styles.layout, index % 2 === 1 && styles.flipped)}>
              {tray.imageUrl && (
                <div className={styles.imageWrap}>
                  <Image src={tray.imageUrl} alt="" fill sizes="(min-width: 56em) 50vw, 100vw" className={styles.image} />
                </div>
              )}

              <div className={styles.copy}>
                <span className="eyebrow">מגש בהרכבה אישית</span>
                <h2 id={titleId} className={styles.title}>
                  {tray.title}
                </h2>
                {tray.description && <p className={styles.description}>{tray.description}</p>}

                <dl className={styles.facts}>
                  {(capacities.length > 0 || hasSingles) && (
                    <div className={styles.fact}>
                      <dt>גדלים</dt>
                      <dd>
                        {capacities.length > 0 && `${capacities.join(" · ")} יחידות`}
                        {capacities.length > 0 && hasSingles && " · "}
                        {hasSingles && "או בודדים"}
                      </dd>
                    </div>
                  )}
                  <div className={styles.fact}>
                    <dt>טעמים</dt>
                    <dd>{tray.items.length} לבחירה</dd>
                  </div>
                  {tray.minUnitPrice > 0 && (
                    <div className={styles.fact}>
                      <dt>מחיר</dt>
                      <dd>החל מ־{formatPrice(tray.minUnitPrice)} ליחידה</dd>
                    </div>
                  )}
                </dl>

                <ButtonLink href={`/tray/${encodeURIComponent(tray.slug)}`} className={styles.cta}>
                  להרכבת המגש שלי
                  <ArrowLeft size={18} strokeWidth={1.25} aria-hidden="true" className={styles.ctaIcon} />
                </ButtonLink>
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
