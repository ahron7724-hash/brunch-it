"use client";

import Image from "next/image";
import Link from "next/link";

import { QuantityStepper } from "@/components/product/ProductPurchase/QuantityStepper";
import { useAvailability } from "@/hooks/useAvailability";
import { formatPrice } from "@/lib/format";
import { useCart, type CartItem } from "@/stores/cart";

import styles from "./CartLine.module.css";

type CartLineProps = { item: CartItem; onNavigate?: () => void };

export function CartLine({ item, onNavigate }: CartLineProps) {
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const availability = useAvailability(item.leadTimeHours);

  return (
    <li className={styles.line}>
      <div className={styles.thumb}>
        {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="5rem" className={styles.image} />}
      </div>
      <div className={styles.info}>
        <Link href={`/${item.kind === "tray" ? "tray" : "product"}/${encodeURIComponent(item.slug)}`} className={styles.title} onClick={onNavigate}>
          {item.title}
        </Link>
        <p className={styles.meta}>{item.sizeLabel}</p>
        {item.optionLabels?.map((label) => (
          <p key={label} className={styles.meta}>
            {label}
          </p>
        ))}
        {item.customText && <p className={styles.meta}>כיתוב: {item.customText}</p>}
        {availability.status === "unavailable" && <p className={styles.warning}>לא יהיה מוכן למועד האיסוף שנבחר</p>}
        <div className={styles.row}>
          <QuantityStepper value={item.quantity} onChange={(q) => setQuantity(item.key, q)} />
          <span className={styles.price}>{formatPrice(item.unitPrice * item.quantity)}</span>
        </div>
        <button type="button" className={styles.remove} onClick={() => remove(item.key)}>
          הסרה
        </button>
      </div>
    </li>
  );
}
