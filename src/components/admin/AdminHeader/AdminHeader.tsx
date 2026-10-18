import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./AdminHeader.module.css";

type AdminHeaderProps = {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  children?: ReactNode;
};

export function AdminHeader({ title, description, back, children }: AdminHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        {back && (
          <Link href={back.href} className={styles.back}>
            → {back.label}
          </Link>
        )}
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {children && <div className={styles.actions}>{children}</div>}
    </header>
  );
}
