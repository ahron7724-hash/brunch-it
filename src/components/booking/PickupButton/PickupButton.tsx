"use client";

import { CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";

import { useHydrated } from "@/hooks/useHydrated";
import { formatPickupDate } from "@/lib/format";
import { useBooking } from "@/stores/booking";

import styles from "./PickupButton.module.css";

const SHOW_AFTER_MS = 60_000;
const SHOWN_KEY = "pickup-button-shown";

/** Whether the button already appeared earlier in this browser tab, so it doesn't vanish again on reload. */
function shownBefore(): boolean {
  try {
    return sessionStorage.getItem(SHOWN_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Floating button (bottom-left) that opens the pickup date & time picker and shows the current choice.
 * It appears a minute into the visit, or right away once a pickup time has been chosen.
 */
export function PickupButton() {
  const hydrated = useHydrated();
  const pickupDate = useBooking((s) => s.pickupDate);
  const pickupSlot = useBooking((s) => s.pickupSlot);
  const openPicker = useBooking((s) => s.openPicker);
  const hasPickup = hydrated && pickupDate !== null && pickupSlot !== null;
  const [delayPassed, setDelayPassed] = useState(false);

  // The delay is a timer (an external system), so it lives in an effect with cleanup.
  useEffect(() => {
    if (shownBefore()) return;
    const id = window.setTimeout(() => {
      setDelayPassed(true);
      try {
        sessionStorage.setItem(SHOWN_KEY, "1");
      } catch {
        // Storage unavailable: the button just waits again on the next page load.
      }
    }, SHOW_AFTER_MS);
    return () => window.clearTimeout(id);
  }, []);

  if (!hasPickup && !delayPassed && !(hydrated && shownBefore())) return null;

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
