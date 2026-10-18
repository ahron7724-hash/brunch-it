"use client";

import { useState } from "react";

import { useBookingConfig } from "@/components/booking/BookingConfigProvider/BookingConfigProvider";
import { Button } from "@/components/ui/Button/Button";
import { useNow } from "@/hooks/useNow";
import { isReadyBy } from "@/lib/booking/availability";
import type { Slot } from "@/lib/booking/types";
import { formatPickupDate } from "@/lib/format";
import { useBooking } from "@/stores/booking";
import { useCart } from "@/stores/cart";

import { dayClosedReason, slotStatuses } from "./dayStatus";
import { PickupCalendar } from "./PickupCalendar";
import styles from "./PickupPicker.module.css";
import { SlotList } from "./SlotList";

type PickerBodyProps = { onDone: () => void };

export function PickerBody({ onDone }: PickerBodyProps) {
  const { days, minLeadTimeHours, defaultLeadTimeHours } = useBookingConfig();
  // The picker opens only after user interaction, so the clock is always available here.
  const now = useNow() ?? 0;
  const savedDate = useBooking((s) => s.pickupDate);
  const savedSlot = useBooking((s) => s.pickupSlot);
  const setPickup = useBooking((s) => s.setPickup);
  const { items, pendingItem, add, setPendingItem, open: openCart } = useCart();

  const openDays = days.filter((d) => dayClosedReason(d, minLeadTimeHours, now) === null);
  const savedStillOpen = openDays.some((d) => d.date === savedDate);
  const [date, setDate] = useState<string | null>(savedStillOpen ? savedDate : null);
  const [slot, setSlot] = useState<Slot | null>(savedStillOpen ? savedSlot : null);
  const months = [...new Set(days.map((d) => d.date.slice(0, 7)))];
  const [month, setMonth] = useState((date ?? openDays[0]?.date ?? days[0]?.date ?? "").slice(0, 7));

  const day = days.find((d) => d.date === date);
  const slots = day ? slotStatuses(day, minLeadTimeHours, now) : [];
  const toCheck = pendingItem ? [...items, pendingItem] : items;
  const notReady =
    date && slot ? toCheck.filter((i) => !isReadyBy(i.leadTimeHours ?? defaultLeadTimeHours, date, slot, now)) : [];

  function confirm() {
    if (!date || !slot) return;
    setPickup(date, slot);
    if (pendingItem && isReadyBy(pendingItem.leadTimeHours ?? defaultLeadTimeHours, date, slot, now)) {
      add(pendingItem);
      setPendingItem(null);
      onDone();
      openCart();
      return;
    }
    setPendingItem(null);
    onDone();
  }

  if (now === 0) return null;

  if (openDays.length === 0) {
    return <p className={styles.empty}>אין כרגע מועדי איסוף פנויים. נסו שוב מאוחר יותר או צרו קשר.</p>;
  }

  return (
    <div className={styles.body}>
      <PickupCalendar
        days={days}
        month={month}
        months={months}
        onMonthChange={setMonth}
        selectedDate={date}
        onSelect={(d) => {
          setDate(d);
          setSlot(null);
        }}
        minLeadTimeHours={minLeadTimeHours}
        now={now}
      />

      {date && (
        <div className={styles.slotSection}>
          <p className={styles.slotTitle}>שעת איסוף ל{formatPickupDate(date)}</p>
          <SlotList slots={slots} selected={slot} onSelect={setSlot} />
        </div>
      )}

      {notReady.length > 0 && (
        <p className={styles.warning} role="alert">
          {notReady.length === 1
            ? `${notReady[0]?.title} לא יספיק להיות מוכן למועד הזה.`
            : `${notReady.length} מוצרים לא יספיקו להיות מוכנים למועד הזה: ${notReady.map((i) => i.title).join(", ")}.`}{" "}
          אפשר לבחור מועד מאוחר יותר.
        </p>
      )}

      <Button onClick={confirm} disabled={!date || !slot}>
        {pendingItem && notReady.length === 0 ? "אישור והוספה לסל" : "אישור"}
      </Button>
    </div>
  );
}
