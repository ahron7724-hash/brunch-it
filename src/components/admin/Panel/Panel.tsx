import type { ReactNode } from "react";

import styles from "./Panel.module.css";

type PanelProps = { title?: string; description?: string; children: ReactNode };

/** White content block on the admin's grey background. */
export function Panel({ title, description, children }: PanelProps) {
  return (
    <section className={styles.panel}>
      {(title || description) && (
        <div className={styles.head}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {description && <p className={styles.description}>{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
