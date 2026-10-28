"use client";

import { CartLine } from "@/components/cart/CartLine/CartLine";
import { ButtonLink } from "@/components/ui/Button/Button";
import { Modal } from "@/components/ui/Modal/Modal";
import { useHydrated } from "@/hooks/useHydrated";
import { formatPickupDate, formatPrice } from "@/lib/format";
import { useBooking } from "@/stores/booking";
import { cartTotal, productsShortfall, useCart } from "@/stores/cart";

import styles from "./CartDrawer.module.css";

type CartDrawerProps = {
  /** Minimum ₪ for regular products (trays don't count); 0 = none. */
  productsMinOrder: number;
};

/** Slide-in cart, mounted once in the layout. */
export function CartDrawer({ productsMinOrder }: CartDrawerProps) {
  const hydrated = useHydrated();
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const items = useCart((s) => s.items);
  const pickupDate = useBooking((s) => s.pickupDate);
  const pickupSlot = useBooking((s) => s.pickupSlot);
  const openPicker = useBooking((s) => s.openPicker);

  if (!hydrated) return null;
  const shortfall = productsShortfall(items, productsMinOrder);

  return (
    <Modal open={isOpen} onClose={close} title="סל הקניות" variant="drawer">
      {items.length === 0 ? (
        <div className={styles.empty}>
          <p>הסל ריק.</p>
          <ButtonLink href="/catalog" variant="line" onClick={close}>
            לקטלוג
          </ButtonLink>
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.pickup}>
            <span>
              {pickupDate && pickupSlot
                ? `איסוף: ${formatPickupDate(pickupDate)} · `
                : "טרם נבחר מועד איסוף"}
              {pickupSlot && (
                <bdi dir="ltr">
                  {pickupSlot.start}–{pickupSlot.end}
                </bdi>
              )}
            </span>
            <button
              type="button"
              className={styles.change}
              onClick={() => {
                close();
                openPicker();
              }}
            >
              {pickupDate ? "שינוי" : "בחירה"}
            </button>
          </div>

          <ul role="list" className={styles.lines}>
            {items.map((item) => (
              <CartLine key={item.key} item={item} onNavigate={close} />
            ))}
          </ul>

          <div className={styles.footer}>
            <p className={styles.total}>
              <span>סה״כ</span>
              <span>{formatPrice(cartTotal(items))}</span>
            </p>
            {shortfall > 0 && (
              <p className={styles.minimum}>
                מינימום הזמנה למוצרים: {formatPrice(productsMinOrder)} (לא כולל מגשים). חסרים עוד {formatPrice(shortfall)}.
              </p>
            )}
            <ButtonLink href="/checkout" onClick={close} className={styles.checkout}>
              להשלמת ההזמנה
            </ButtonLink>
          </div>
        </div>
      )}
    </Modal>
  );
}
