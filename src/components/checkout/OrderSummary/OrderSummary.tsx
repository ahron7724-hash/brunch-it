"use client";

import { formatPickupDate, formatPrice } from "@/lib/format";
import type { CartItem } from "@/stores/cart";
import type { PickupSlot } from "@/stores/booking";

import styles from "./OrderSummary.module.css";

type OrderSummaryProps = {
  items: CartItem[];
  pickupDate: string | null;
  pickupSlot: PickupSlot | null;
  fulfillmentLabel: string;
  deliveryFee: number;
  onChangePickup: () => void;
};

/** Sticky summary next to the checkout form. Prices here are a preview; the server re-prices the order. */
export function OrderSummary({ items, pickupDate, pickupSlot, fulfillmentLabel, deliveryFee, onChangePickup }: OrderSummaryProps) {
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <aside className={styles.summary} aria-labelledby="summary-title">
      <h2 id="summary-title" className={styles.title}>
        סיכום הזמנה
      </h2>

      <div className={styles.pickup}>
        <span>
          {fulfillmentLabel}:{" "}
          {pickupDate && pickupSlot ? (
            <>
              {formatPickupDate(pickupDate)} · <bdi dir="ltr">{pickupSlot.start}–{pickupSlot.end}</bdi>
            </>
          ) : (
            "טרם נבחר מועד"
          )}
        </span>
        <button type="button" onClick={onChangePickup} className={styles.change}>
          {pickupDate ? "שינוי" : "בחירת מועד"}
        </button>
      </div>

      <ul role="list" className={styles.items}>
        {items.map((item) => (
          <li key={item.key} className={styles.item}>
            <span className={styles.itemText}>
              {item.quantity} × {item.title}
              <span className={styles.itemMeta}>
                {[item.sizeLabel, ...(item.optionLabels ?? []), item.customText ? `כיתוב: ${item.customText}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
            <span className={styles.amount}>{formatPrice(item.unitPrice * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <dl className={styles.totals}>
        <div className={styles.totalRow}>
          <dt>ביניים</dt>
          <dd>{formatPrice(subtotal)}</dd>
        </div>
        {deliveryFee > 0 && (
          <div className={styles.totalRow}>
            <dt>משלוח</dt>
            <dd>{formatPrice(deliveryFee)}</dd>
          </div>
        )}
        <div className={styles.grandTotal}>
          <dt>סה״כ</dt>
          <dd>{formatPrice(subtotal + deliveryFee)}</dd>
        </div>
      </dl>
    </aside>
  );
}
