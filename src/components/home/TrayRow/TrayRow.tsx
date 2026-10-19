import Image from "next/image";
import Link from "next/link";

import { SectionHeading } from "@/components/ui/SectionHeading/SectionHeading";
import type { Tray } from "@/lib/data/types";
import { formatPrice } from "@/lib/format";

import styles from "./TrayRow.module.css";

type TrayRowProps = { trays: Tray[] };

/** One row of square tiles, one per build-your-own tray, each opening its tray page. */
export function TrayRow({ trays }: TrayRowProps) {
  if (trays.length === 0) return null;

  return (
    <section className="section" aria-labelledby="trays-title">
      <div className="container">
        <SectionHeading id="trays-title" eyebrow="מרכיבים לבד" title="מגש בהרכבה אישית">
          <p className={styles.intro}>בוחרים גודל מגש וממלאים אותו בדיוק במה שאוהבים.</p>
        </SectionHeading>
        <ul role="list" className={styles.row}>
          {trays.map((tray) => (
            <li key={tray.id} className="reveal">
              <Link href={`/tray/${encodeURIComponent(tray.slug)}`} className={styles.tile}>
                <span className={styles.imageWrap}>
                  {tray.imageUrl && <Image src={tray.imageUrl} alt="" fill sizes="(min-width: 64em) 22rem, 70vw" className={styles.image} />}
                </span>
                <span className={styles.name}>{tray.title}</span>
                {tray.minUnitPrice > 0 && <span className={styles.price}>החל מ־{formatPrice(tray.minUnitPrice)} ליחידה</span>}
                <span className={styles.cta}>להזמנה</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
