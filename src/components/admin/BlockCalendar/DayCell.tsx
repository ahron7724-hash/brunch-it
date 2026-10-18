import clsx from "clsx";

import type { AdminCalendarDay } from "@/lib/admin/calendar";

import styles from "./BlockCalendar.module.css";

const fullDate = new Intl.DateTimeFormat("he-IL", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

type DayCellProps = {
  date: string;
  /** Undefined for dates outside the booking window (past, or too far ahead). */
  day: AdminCalendarDay | undefined;
  busy: boolean;
  onToggle: (day: AdminCalendarDay) => void;
};

export function DayCell({ date, day, busy, onToggle }: DayCellProps) {
  const number = Number(date.slice(8));
  const label = fullDate.format(new Date(`${date}T12:00:00Z`));

  if (!day || day.autoClosed) {
    return (
      <span className={clsx(styles.day, styles.dayAuto)} title={day?.autoClosed ?? undefined} aria-label={`${label}${day?.autoClosed ? `, ${day.autoClosed}` : ""}`}>
        <span className={styles.number}>{number}</span>
        {day?.autoClosed && <span className={styles.tag}>{day.autoClosed}</span>}
      </span>
    );
  }

  const ordersText = day.orders === 1 ? "הזמנה 1" : `${day.orders} הזמנות`;
  const state = day.blocked ? "חסום" : day.customHours ? "שעות מיוחדות" : "פתוח";

  return (
    <button
      type="button"
      className={clsx(styles.day, day.blocked && styles.dayBlocked, day.customHours && styles.dayCustom, busy && styles.dayBusy)}
      onClick={() => onToggle(day)}
      disabled={busy}
      aria-pressed={day.blocked}
      aria-label={`${label}: ${state}${day.orders > 0 ? `, ${ordersText}` : ""}. ${day.blocked ? "לחיצה תפתח את היום" : "לחיצה תחסום את היום"}`}
      title={day.note ?? undefined}
    >
      <span className={styles.number}>{number}</span>
      {day.orders > 0 && <span className={styles.orders}>{ordersText}</span>}
      {day.blocked && <span className={styles.tag}>חסום</span>}
    </button>
  );
}
