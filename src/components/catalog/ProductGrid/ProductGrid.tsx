import clsx from "clsx";

import type { ProductSummary } from "@/lib/data/types";

import { ProductCard } from "../ProductCard/ProductCard";
import styles from "./ProductGrid.module.css";

type ProductGridProps = {
  products: ProductSummary[];
  emptyText?: string;
};

export function ProductGrid({ products, emptyText = "אין כרגע מוצרים להצגה." }: ProductGridProps) {
  if (products.length === 0) {
    return <p className={styles.empty}>{emptyText}</p>;
  }

  return (
    <ul role="list" className={styles.grid}>
      {products.map((product) => (
        <li key={product.id} className={clsx("reveal", styles.item)}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
