"use client";

import { useBookingConfig } from "@/components/booking/BookingConfigProvider/BookingConfigProvider";
import { isReadyBy } from "@/lib/booking/availability";
import { useBooking } from "@/stores/booking";

import { useHydrated } from "./useHydrated";
import { useNow } from "./useNow";

export type Availability =
  | { status: "unknown" } // SSR, or no pickup slot chosen yet
  | { status: "available"; leadTimeHours: number }
  | { status: "unavailable"; leadTimeHours: number };

/** Whether a product with the given lead time can be ready for the chosen pickup slot. */
export function useAvailability(productLeadTimeHours: number | null): Availability {
  const hydrated = useHydrated();
  const now = useNow();
  const { defaultLeadTimeHours } = useBookingConfig();
  const pickupDate = useBooking((s) => s.pickupDate);
  const pickupSlot = useBooking((s) => s.pickupSlot);

  if (!hydrated || now === null || !pickupDate || !pickupSlot) return { status: "unknown" };

  const leadTimeHours = productLeadTimeHours ?? defaultLeadTimeHours;
  return isReadyBy(leadTimeHours, pickupDate, pickupSlot, now)
    ? { status: "available", leadTimeHours }
    : { status: "unavailable", leadTimeHours };
}
