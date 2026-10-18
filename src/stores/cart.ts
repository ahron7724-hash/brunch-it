"use client";

import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { cartItemSchema, persistedCartSchema } from "@/lib/validation/stores";

export type CartItem = z.infer<typeof cartItemSchema>;

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  /** Item waiting for the customer to choose a pickup slot (first add-to-cart). Not persisted. */
  pendingItem: CartItem | null;
  setPendingItem: (item: CartItem | null) => void;
  add: (item: CartItem) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      pendingItem: null,
      setPendingItem: (pendingItem) => set({ pendingItem }),
      add: (item) =>
        set((state) => {
          const exists = state.items.some((i) => i.key === item.key);
          return {
            items: exists
              ? state.items.map((i) => (i.key === item.key ? { ...i, quantity: i.quantity + item.quantity } : i))
              : [...state.items, item],
          };
        }),
      setQuantity: (key, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.key !== key)
              : state.items.map((i) => (i.key === key ? { ...i, quantity } : i)),
        })),
      remove: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: "lea-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ items }) => ({ items }),
      // localStorage is user-editable: accept only a valid shape, otherwise start clean.
      // Prices here are for display only; the server recalculates every order from the DB.
      merge: (persisted, current) => {
        const parsed = persistedCartSchema.safeParse(persisted);
        return parsed.success ? { ...current, ...parsed.data } : current;
      },
    }
  )
);

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}
