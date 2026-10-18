"use client";

import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { persistedBookingSchema, pickupSlotSchema } from "@/lib/validation/stores";

export type PickupSlot = z.infer<typeof pickupSlotSchema>;

type BookingState = {
  /** Pickup date as YYYY-MM-DD (Israel local date). */
  pickupDate: string | null;
  pickupSlot: PickupSlot | null;
  isPickerOpen: boolean;
  setPickup: (date: string, slot: PickupSlot) => void;
  clearPickup: () => void;
  openPicker: () => void;
  closePicker: () => void;
};

export const useBooking = create<BookingState>()(
  persist(
    (set) => ({
      pickupDate: null,
      pickupSlot: null,
      isPickerOpen: false,
      setPickup: (pickupDate, pickupSlot) => set({ pickupDate, pickupSlot, isPickerOpen: false }),
      clearPickup: () => set({ pickupDate: null, pickupSlot: null }),
      openPicker: () => set({ isPickerOpen: true }),
      closePicker: () => set({ isPickerOpen: false }),
    }),
    {
      name: "lea-booking",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ pickupDate, pickupSlot }) => ({ pickupDate, pickupSlot }),
      // localStorage is user-editable: accept only a valid shape, otherwise start clean.
      merge: (persisted, current) => {
        const parsed = persistedBookingSchema.safeParse(persisted);
        return parsed.success ? { ...current, ...parsed.data } : current;
      },
    }
  )
);
