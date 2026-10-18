import clsx from "clsx";

import type { Slot } from "@/lib/booking/types";

import type { SlotStatus } from "./dayStatus";
import styles from "./PickupPicker.module.css";

type SlotListProps = {
  slots: SlotStatus[];
  selected: Slot | null;
  onSelect: (slot: Slot) => void;
};

export function SlotList({ slots, selected, onSelect }: SlotListProps) {
  return (
    <div className={styles.slots} role="group" aria-label="בחירת שעת איסוף">
      {slots.map(({ slot, open }) => {
        const isSelected = selected?.start === slot.start && selected.end === slot.end;
        return (
          <button
            key={`${slot.start}-${slot.end}`}
            type="button"
            className={clsx(styles.slot, isSelected && styles.slotSelected)}
            disabled={!open}
            aria-pressed={isSelected}
            onClick={() => onSelect(slot)}
          >
            <span className="ltr">
              {slot.start}–{slot.end}
            </span>
            {!open && <span className={styles.slotNote}>מאוחר מדי להזמנה</span>}
          </button>
        );
      })}
    </div>
  );
}
