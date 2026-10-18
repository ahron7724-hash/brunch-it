import clsx from "clsx";
import Image from "next/image";

import { ButtonLink } from "@/components/ui/Button/Button";
import type { ContentPage } from "@/lib/data/types";

import styles from "./AboutTeaser.module.css";

type AboutTeaserProps = {
  page: ContentPage;
  kashrutLine: string;
};

/** Short intro on the home page: image, first paragraph of the about text, link to the full page. */
export function AboutTeaser({ page, kashrutLine }: AboutTeaserProps) {
  const intro = firstParagraph(page.bodyText);

  return (
    <section className="section" aria-labelledby="about-teaser-title">
      <div className={clsx("container", "reveal", styles.layout)}>
        {page.heroImageUrl && (
          <div className={styles.imageWrap}>
            <Image src={page.heroImageUrl} alt="" fill sizes="(min-width: 56em) 50vw, 100vw" className={styles.image} />
          </div>
        )}
        <div className={styles.copy}>
          <span className="eyebrow">אודות</span>
          <h2 id="about-teaser-title">{page.title}</h2>
          {intro && <p className={styles.intro}>{intro}</p>}
          {kashrutLine && (
            <p className={styles.kosher}>
              <span className={styles.kosherLabel}>כשרות</span>
              <span>{kashrutLine}</span>
            </p>
          )}
          <ButtonLink href="/about" variant="text">
            לסיפור המלא
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

function firstParagraph(text: string): string | null {
  const block = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .find((b) => b.length > 0 && !b.startsWith("## "));
  return block ?? null;
}
