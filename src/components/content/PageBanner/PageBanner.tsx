import clsx from "clsx";
import Image from "next/image";

import styles from "./PageBanner.module.css";

type PageBannerProps = {
  title: string;
  imageUrl: string | null;
  eyebrow?: string;
};

/** Atmosphere image with the page title over it; falls back to a plain title when there is no image. */
export function PageBanner({ title, imageUrl, eyebrow }: PageBannerProps) {
  if (!imageUrl) {
    return (
      <div className={clsx("container", styles.plain)}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
      </div>
    );
  }

  return (
    <section className={styles.banner}>
      <Image src={imageUrl} alt="" fill sizes="100vw" preload className={styles.image} />
      <div className={styles.shade} />
      <div className={clsx("container", styles.content)}>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h1>{title}</h1>
      </div>
    </section>
  );
}
