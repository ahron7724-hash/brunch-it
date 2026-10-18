import clsx from "clsx";
import Link from "next/link";

import styles from "./PageIntro.module.css";

type Crumb = { href: string; label: string };

type PageIntroProps = {
  title: string;
  description?: string | null;
  crumbs?: Crumb[];
};

/** Title block at the top of inner pages, with optional breadcrumbs. */
export function PageIntro({ title, description, crumbs = [] }: PageIntroProps) {
  return (
    <div className={clsx("container", styles.intro)}>
      {crumbs.length > 0 && (
        <nav aria-label="פירורי לחם">
          <ol role="list" className={styles.crumbs}>
            {crumbs.map((crumb) => (
              <li key={crumb.href}>
                <Link href={crumb.href}>{crumb.label}</Link>
              </li>
            ))}
            <li aria-current="page">{title}</li>
          </ol>
        </nav>
      )}
      <h1 className={styles.title}>{title}</h1>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  );
}
