import clsx from "clsx";
import Link from "next/link";

import { DIET_LABELS } from "@/lib/data/types";
import type { CatalogSearch } from "@/lib/validation/catalog";
import { DIET_TAGS } from "@/lib/validation/content";

import styles from "./CatalogFilters.module.css";

type CatalogFiltersProps = {
  basePath: string;
  current: CatalogSearch;
};

const SORT_OPTIONS: CatalogSearch["sort"][] = ["default", "price-asc", "price-desc"];

const SORT_LABELS: Record<CatalogSearch["sort"], string> = {
  default: "מומלץ",
  "price-asc": "מחיר: מהנמוך",
  "price-desc": "מחיר: מהגבוה",
};

/** Diet filter and sort as plain links, so filtering works without JavaScript. */
export function CatalogFilters({ basePath, current }: CatalogFiltersProps) {
  const dietOptions = [undefined, ...DIET_TAGS] as const;

  return (
    <div className={styles.bar}>
      <nav aria-label="סינון לפי סוג" className={styles.group}>
        {dietOptions.map((diet) => {
          const active = current.diet === diet;
          return (
            <Link
              key={diet ?? "all"}
              href={buildHref(basePath, { ...current, diet })}
              className={clsx(styles.chip, active && styles.active)}
              aria-current={active ? "page" : undefined}
              scroll={false}
            >
              {diet ? DIET_LABELS[diet] : "הכל"}
            </Link>
          );
        })}
      </nav>

      <nav aria-label="מיון" className={styles.sort}>
        <span className={styles.sortLabel}>מיון:</span>
        {SORT_OPTIONS.map((sort) => {
          const active = current.sort === sort;
          return (
            <Link
              key={sort}
              href={buildHref(basePath, { ...current, sort })}
              className={clsx(styles.sortLink, active && styles.sortActive)}
              aria-current={active ? "page" : undefined}
              scroll={false}
            >
              {SORT_LABELS[sort]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function buildHref(basePath: string, search: CatalogSearch): string {
  const params = new URLSearchParams();
  if (search.diet) params.set("diet", search.diet);
  if (search.sort !== "default") params.set("sort", search.sort);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
