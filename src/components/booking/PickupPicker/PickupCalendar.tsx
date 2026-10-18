import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { dayOfWeek } from "@/lib/booking/time";
import type { BookingDay } from "@/lib/booking/types";

import { dayClosedReason } from "./dayStatus";
import styles from "./PickupPicker.module.css";

const WEEKDAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const monthFormatter = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric", timeZone: "UTC" });
const fullDateFormatter = new Intl.DateTimeFormat("he-IL", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

type PickupCalendarProps = {
  days: BookingDay[];
  month: string; // YYYY-MM
  months: string[];
  onMonthChange: (month: string) => void;
  selectedDate: string | null;
  onSelect: (date: string) => void;
  minLeadTimeHours: number;
  now: number;
};

export function PickupCalendar(props: PickupCalendarProps) {
  const { days, month, months, onMonthChange, selectedDate, onSelect, minLeadTimeHours, now } = props;
  const byDate = new Map(days.map((d) => [d.date, d]));
  const blanks = dayOfWeek(`${month}-01`);
  const monthIndex = months.indexOf(month);
  const prev = months[monthIndex - 1];
  const next = months[monthIndex + 1];

  return (
    <div className={styles.calendar}>
      <div className={styles.monthBar}>
        <button type="button" className={styles.monthNav} onClick={() => prev && onMonthChange(prev)} disabled={!prev} aria-label="החודש הקודם">
          <ChevronRight size={18} strokeWidth={1.25} aria-hidden="true" />
        </button>
        <span className={styles.monthName} aria-live="polite">
          {monthFormatter.format(new Date(`${month}-01T12:00:00Z`))}
        </span>
        <button type="button" className={styles.monthNav} onClick={() => next && onMonthChange(next)} disabled={!next} aria-label="החודש הבא">
          <ChevronLeft size={18} strokeWidth={1.25} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.grid} role="group" aria-label="בחירת תאריך">
        {WEEKDAYS.map((name) => (
          <span key={name} className={styles.weekday} aria-hidden="true">
            {name}
          </span>
        ))}
        {Array.from({ length: blanks }, (_, i) => (
          <span key={`blank-${month}-${i}`} />
        ))}
        {monthDates(month).map((date) => {
          const day = byDate.get(date);
          // Dates outside the booking window (past, or beyond the horizon) have no BookingDay.
          const reason = day ? dayClosedReason(day, minLeadTimeHours, now) : "לא ניתן להזמין לתאריך זה";
          const label = fullDateFormatter.format(new Date(`${date}T12:00:00Z`));
          return (
            <button
              key={date}
              type="button"
              className={clsx(styles.day, reason && styles.dayClosed, date === selectedDate && styles.daySelected)}
              disabled={reason !== null}
              aria-pressed={date === selectedDate}
              aria-label={reason ? `${label}, לא זמין: ${reason}` : label}
              title={reason ?? undefined}
              onClick={() => onSelect(date)}
            >
              {Number(date.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** All ISO dates of a "YYYY-MM" month. */
function monthDates(month: string): string[] {
  const [y, m] = month.split("-").map(Number);
  const count = new Date(Date.UTC(y ?? 0, m ?? 1, 0)).getUTCDate();
  return Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
}
