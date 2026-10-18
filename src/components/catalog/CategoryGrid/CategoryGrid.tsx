import Image from "next/image";
import Link from "next/link";

import type { Category } from "@/lib/data/types";

import styles from "./CategoryGrid.module.css";

type CategoryGridProps = {
  categories: Category[];
  counts?: Record<string, number>;
};

/** Visual category tiles: image above, name below. */
export function CategoryGrid({ categories, counts }: CategoryGridProps) {
  if (categories.length === 0) return null;

  return (
    <ul role="list" className={styles.grid}>
      {categories.map((category) => {
        const count = counts?.[category.id];
        return (
          <li key={category.id} className="reveal">
            <Link href={`/category/${encodeURIComponent(category.slug)}`} className={styles.tile}>
              <span className={styles.imageWrap}>
                {category.imageUrl && (
                  <Image src={category.imageUrl} alt="" fill sizes="(min-width: 64em) 25vw, 50vw" className={styles.image} />
                )}
              </span>
              <span className={styles.name}>{category.name}</span>
              {count !== undefined && <span className={styles.count}>{count} מוצרים</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
