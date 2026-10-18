import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./SectionHeading.module.css";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  id?: string;
  children?: ReactNode;
  link?: { href: string; label: string };
};

/** Eyebrow + title (+ optional intro and "see all" link) at the top of a section. */
export function SectionHeading({ eyebrow, title, id, children, link }: SectionHeadingProps) {
  return (
    <div className={clsx("reveal", styles.head)}>
      <div className={styles.text}>
        <span className="eyebrow">{eyebrow}</span>
        <h2 id={id}>{title}</h2>
        {children}
      </div>
      {link && (
        <Link href={link.href} className={styles.link}>
          {link.label}
        </Link>
      )}
    </div>
  );
}
