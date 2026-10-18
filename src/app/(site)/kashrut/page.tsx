import clsx from "clsx";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { PageBanner } from "@/components/content/PageBanner/PageBanner";
import { RichText } from "@/components/ui/RichText/RichText";
import { getKashrutPage } from "@/lib/data/content";
import { formatIsoDate } from "@/lib/format";

import styles from "./kashrut.module.css";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "כשרות",
  description: "תעודת הכשרות, סוג ההשגחה וההנחיות.",
};

export default async function KashrutPage() {
  const page = await getKashrutPage();
  if (!page) notFound();

  return (
    <>
      <PageBanner title={page.title} imageUrl={page.heroImageUrl} eyebrow="כשרות" />

      <section className={clsx("container", styles.layout)}>
        <div className={styles.text}>
          {(page.supervision || page.validUntil) && (
            <dl className={styles.facts}>
              {page.supervision && (
                <div className={styles.fact}>
                  <dt>השגחה</dt>
                  <dd>{page.supervision}</dd>
                </div>
              )}
              {page.validUntil && (
                <div className={styles.fact}>
                  <dt>בתוקף עד</dt>
                  <dd>{formatIsoDate(page.validUntil)}</dd>
                </div>
              )}
            </dl>
          )}
          <RichText text={page.bodyText} />
        </div>

        {page.certificateUrl && (
          <figure className={styles.certificate}>
            <a href={page.certificateUrl} target="_blank" rel="noopener noreferrer" className={styles.certificateLink}>
              <Image
                src={page.certificateUrl}
                alt="תעודת הכשרות"
                fill
                sizes="(min-width: 56em) 40vw, 100vw"
                className={styles.certificateImage}
              />
            </a>
            <figcaption className={styles.caption}>לחצו על התעודה לצפייה בגודל מלא</figcaption>
          </figure>
        )}
      </section>
    </>
  );
}
