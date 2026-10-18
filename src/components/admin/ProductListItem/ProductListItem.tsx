import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";

import { ProductRowActions } from "@/components/admin/ProductRowActions/ProductRowActions";
import { BidiText } from "@/components/ui/BidiText/BidiText";
import type { AdminProductRow } from "@/lib/admin/products";
import { formatPrice } from "@/lib/format";

import styles from "./ProductListItem.module.css";

type ProductListItemProps = { product: AdminProductRow };

const MAX_IMAGES = 3;

/** One product in the admin list: all its images, key details, and edit / show-hide / delete buttons. The card opens the editor. */
export function ProductListItem({ product }: ProductListItemProps) {
  const href = `/admin/products/${product.id}`;
  const emptySlots = Math.max(0, MAX_IMAGES - product.imageUrls.length);

  return (
    <li className={clsx(styles.item, !product.isActive && styles.inactive)}>
      <div className={styles.images}>
        {product.imageUrls.map((url, index) => (
          <span key={url} className={clsx(styles.thumb, index === 0 && styles.main)}>
            <Image src={url} alt="" fill sizes="7rem" className={styles.image} />
          </span>
        ))}
        {Array.from({ length: emptySlots }, (_, i) => (
          <span key={`empty-${product.id}-${i}`} className={clsx(styles.thumb, styles.empty)} aria-hidden="true" />
        ))}
      </div>

      <div className={styles.info}>
        <h2 className={styles.title}>
          {/* The link's ::after covers the card, so clicking anywhere opens the editor. */}
          <Link href={href} className={styles.cardLink}>
            {product.title}
          </Link>
          {product.isFeatured && <span className={styles.star} aria-label="מופיע בדף הבית"> ★</span>}
        </h2>
        <p className={styles.meta}>
          <span className={product.isActive ? styles.shown : styles.hidden}>{product.isActive ? "מוצג באתר" : "מוסתר"}</span>
          {" · "}
          <BidiText text={`${product.imageUrls.length}/${MAX_IMAGES} תמונות`} />
          {" · "}
          {product.priceRange ? <BidiText text={priceText(product.priceRange)} /> : <span className={styles.hidden}>אין מחיר</span>}
        </p>
        {product.categories.length > 0 && <p className={styles.meta}>{product.categories.join(", ")}</p>}
      </div>

      <ProductRowActions productId={product.id} title={product.title} isActive={product.isActive} />
    </li>
  );
}

function priceText([min, max]: [number, number]): string {
  // "260–420 ₪": the numeric range is kept left-to-right by BidiText.
  return min === max ? formatPrice(min) : `${min}–${formatPrice(max)}`;
}
