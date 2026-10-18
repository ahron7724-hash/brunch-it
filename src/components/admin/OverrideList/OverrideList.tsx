"use client";

import { deleteDateOverride } from "@/app/admin/(panel)/schedule/actions";
import { DeleteButton } from "@/components/admin/DeleteButton/DeleteButton";
import { formatPickupDate } from "@/lib/format";

import styles from "./OverrideList.module.css";

type OverrideItem = { id: string; date: string; isBlocked: boolean; slots: { start: string; end: string }[]; note: string | null };

type OverrideListProps = { items: OverrideItem[] };

export function OverrideList({ items }: OverrideListProps) {
  if (items.length === 0) return <p className={styles.empty}>אין שינויים לתאריכים עתידיים.</p>;

  return (
    <ul role="list" className={styles.list}>
      {items.map((item) => (
        <li key={item.id} className={styles.item}>
          <span className={styles.date}>{formatPickupDate(item.date)}</span>
          <span className={item.isBlocked ? styles.blocked : styles.custom}>
            {item.isBlocked ? (
              "סגור"
            ) : (
              <bdi dir="ltr">{item.slots.map((s) => `${s.start}–${s.end}`).join(", ")}</bdi>
            )}
          </span>
          {item.note && <span className={styles.note}>{item.note}</span>}
          <DeleteButton label="ביטול השינוי" confirmText="לבטל ולחזור לשעות הרגילות?" onDelete={() => deleteDateOverride(item.id)} />
        </li>
      ))}
    </ul>
  );
}
