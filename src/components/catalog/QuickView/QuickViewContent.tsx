"use client";

import Link from "next/link";

import { useBookingConfig } from "@/components/booking/BookingConfigProvider/BookingConfigProvider";
import { ProductGallery } from "@/components/product/ProductGallery/ProductGallery";
import { ProductPurchase } from "@/components/product/ProductPurchase/ProductPurchase";
import { BidiText } from "@/components/ui/BidiText/BidiText";
import { DIET_LABELS, type ProductDetail } from "@/lib/data/types";
import { formatPrice } from "@/lib/format";
import { formatLeadTime } from "@/lib/leadTime";

import styles from "./QuickView.module.css";

type QuickViewContentProps = { product: ProductDetail; onAdded: () => void };

export function QuickViewContent({ product, onAdded }: QuickViewContentProps) {
  const { defaultLeadTimeHours } = useBookingConfig();
  const singleSize = product.sizes.length === 1 ? product.sizes[0] : undefined;

  return (
    <div className={styles.layout}>
      <div className={styles.gallery}>
        <ProductGallery images={product.images} title={product.title} />
      </div>
      <div className={styles.info}>
        {product.dietTags.length > 0 && <span className={styles.diet}>{product.dietTags.map((t) => DIET_LABELS[t]).join(" · ")}</span>}
        {singleSize && (
          <p className={styles.price}>
            {formatPrice(singleSize.price)}
            {singleSize.serves && (
              <span className={styles.serves}>
                {" · "}
                <BidiText text={singleSize.serves} />
              </span>
            )}
          </p>
        )}
        {product.description && <p className={styles.description}>{product.description}</p>}
        <p className={styles.lead}>הזמנה לפחות {formatLeadTime(product.leadTimeHours ?? defaultLeadTimeHours)} לפני מועד האיסוף</p>
        <ProductPurchase product={product} onAdded={onAdded} />
        <Link href={`/product/${encodeURIComponent(product.slug)}`} className={styles.fullLink}>
          לעמוד המוצר המלא
        </Link>
      </div>
    </div>
  );
}
