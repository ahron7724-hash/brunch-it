"use client";

import { CalendarDays } from "lucide-react";

import { useHydrated } from "@/hooks/useHydrated";
import { formatPickupDate } from "@/lib/format";
import { useBooking } from "@/stores/booking";

import styles from "./PickupButton.module.css";

/** Floating button (bottom-left) that opens the pickup date & time picker and shows the current choice. */
export function PickupButton() {
  const hydrated = useHydrated();
  const pickupDate = useBooking((s) => s.pickupDate);
  const pickupSlot = useBooking((s) => s.pickupSlot);
  const openPicker = useBooking((s) => s.openPicker);
  const hasPickup = hydrated && pickupDate !== null && pickupSlot !== null;

  return (
    <button
      type="button"
      onClick={openPicker}
      className={styles.button}
      aria-label={hasPickup ? `מועד איסוף: ${formatPickupDate(pickupDate)}, ${pickupSlot.start} עד ${pickupSlot.end}. לשינוי` : "בחירת מועד איסוף"}
    >
      <CalendarDays size={18} strokeWidth={1.5} aria-hidden="true" />
      {hasPickup ? (
        <span className={styles.text}>
          <span className={styles.label}>איסוף</span>
          <span className={styles.value}>
            {formatPickupDate(pickupDate)} ·{" "}
            <bdi dir="ltr">
              {pickupSlot.start}–{pickupSlot.end}
            </bdi>
          </span>
        </span>
      ) : (
        <span className={styles.value}>בחירת מועד איסוף</span>
      )}
    </button>
  );
}
