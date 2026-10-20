import Link from "next/link";

import { BidiText } from "@/components/ui/BidiText/BidiText";
import { AvailabilityNote } from "../AvailabilityNote/AvailabilityNote";
import { CardMedia } from "../CardMedia/CardMedia";
import { QuickView } from "../QuickView/QuickView";
import { formatPrice } from "@/lib/format";
import { DIET_LABELS, type ProductSummary } from "@/lib/data/types";

import styles from "./ProductCard.module.css";

type ProductCardProps = { product: ProductSummary };

export function ProductCard({ product }: ProductCardProps) {
  const href = `/product/${encodeURIComponent(product.slug)}`;
  const firstSize = product.sizes[0];
  const hasRange = product.sizes.length > 1;

  return (
    <article className={styles.card}>
      <CardMedia href={href} images={product.images} sizes="(min-width: 64em) 25vw, (min-width: 40em) 50vw, 100vw">
        <QuickView productId={product.id} title={product.title} className={styles.quickView} />
      </CardMedia>

      <div className={styles.body}>
        {product.dietTags.length > 0 && (
          <span className={styles.diet}>{product.dietTags.map((t) => DIET_LABELS[t]).join(" · ")}</span>
        )}
        <h3 className={styles.title}>
          <Link href={href}>{product.title}</Link>
        </h3>
        {firstSize?.serves && (
          <p className={styles.meta}>
            {hasRange ? `${product.sizes.length} גדלים · ` : ""}
            <BidiText text={firstSize.serves} />
          </p>
        )}
        <p className={styles.price}>
          {hasRange && <span className={styles.from}>החל מ־</span>}
          {formatPrice(product.minPrice)}
        </p>
        <AvailabilityNote leadTimeHours={product.leadTimeHours} />
      </div>
    </article>
  );
}
