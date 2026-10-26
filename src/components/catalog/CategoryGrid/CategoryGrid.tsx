import Image from "next/image";
import Link from "next/link";

import type { Category } from "@/lib/data/types";

import styles from "./CategoryGrid.module.css";
import { CategoryRail } from "./CategoryRail";

type CategoryGridProps = {
  categories: Category[];
  counts?: Record<string, number>;
};

/** More than this many categories turn into a scrolling row with arrows on desktop. */
const ROW_SIZE = 4;

/** Visual category tiles: image above, name below. */
export function CategoryGrid({ categories, counts }: CategoryGridProps) {
  if (categories.length === 0) return null;
  const isRail = categories.length > ROW_SIZE;

  const tiles = categories.map((category) => {
    const count = counts?.[category.id];
    return (
      // Inside the rail the wrapper fades in instead: a horizontal scroller would break each tile's scroll animation.
      <li key={category.id} className={isRail ? styles.railItem : "reveal"}>
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
  });

  if (isRail) return <CategoryRail>{tiles}</CategoryRail>;

  return (
    <ul role="list" className={styles.grid}>
      {tiles}
    </ul>
  );
}
