"use client";

import { useHydrated } from "@/hooks/useHydrated";
import { cartCount, useCart } from "@/stores/cart";

import styles from "./HeaderCart.module.css";

export function HeaderCart() {
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const open = useCart((s) => s.open);
  const count = hydrated ? cartCount(items) : 0;

  return (
    <button type="button" onClick={open} className={styles.cart} aria-label={`סל הקניות, ${count} פריטים`}>
      סל <span className={styles.count}>({count})</span>
    </button>
  );
}
