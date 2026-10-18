import clsx from "clsx";
import Image from "next/image";

import { safeHref } from "@/lib/security/safeHref";

import styles from "./Logo.module.css";

type LogoProps = {
  name: string;
  tagline: string;
  logoUrl: string | null;
  align?: "center" | "start";
  inverse?: boolean;
};

/** Business logo image when one is uploaded, otherwise the business name and tagline as text. */
export function Logo({ name, tagline, logoUrl, align = "center", inverse = false }: LogoProps) {
  const src = safeHref(logoUrl);

  return (
    <span className={clsx(styles.logo, styles[align], inverse && styles.inverse)}>
      {src ? (
        <Image src={src} alt={name} width={270} height={60} preload className={styles.image} />
      ) : (
        <>
          <strong className={styles.name}>{name}</strong>
          {tagline && <small className={styles.tagline}>{tagline}</small>}
        </>
      )}
    </span>
  );
}
