"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useTransition } from "react";

import { setDateBlocked } from "@/app/admin/(panel)/schedule/actions";
import type { AdminCalendarDay } from "@/lib/admin/calendar";
import { dayOfWeek } from "@/lib/booking/time";

import styles from "./BlockCalendar.module.css";
import { DayCell } from "./DayCell";

const WEEKDAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const monthFormatter = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric", timeZone: "UTC" });
const DEFAULT_NOTE = "התפוסה מלאה";

type BlockCalendarProps = { days: AdminCalendarDay[] };

/** Owner's calendar: click a day to block it (e.g. fully booked) or to reopen it. Shows orders per day. */
export function BlockCalendar({ days: initialDays }: BlockCalendarProps) {
  const [days, setDays] = useState(initialDays);
  const [synced, setSynced] = useState(initialDays);
  if (synced !== initialDays) {
    setSynced(initialDays);
    setDays(initialDays);
  }
  const months = [...new Set(days.map((d) => d.date.slice(0, 7)))];
  const [month, setMonth] = useState(months[0] ?? "");
  const [note, setNote] = useState(DEFAULT_NOTE);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busyDate, setBusyDate] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const byDate = new Map(days.map((d) => [d.date, d]));
  const monthIndex = months.indexOf(month);

  function toggle(day: AdminCalendarDay) {
    const block = !day.blocked;
    setBusyDate(day.date);
    // Optimistic: flip the day right away, undo if the server refuses.
    setDays((all) => all.map((d) => (d.date === day.date ? { ...d, blocked: block, customHours: false, note: block ? note : null } : d)));
    startTransition(async () => {
      const result = await setDateBlocked(day.date, block, note);
      if (!result.ok) setDays((all) => all.map((d) => (d.date === day.date ? day : d)));
      setMessage({ ok: result.ok, text: result.ok ? (result.message ?? "עודכן") : result.message });
      setBusyDate(null);
    });
  }

  return (
    <div className={styles.calendar}>
      <label className={styles.noteField}>
        <span className={styles.noteLabel}>הסיבה שתוצג ללקוחות ביום חסום</span>
        <input value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} className={styles.noteInput} />
      </label>

      <div className={styles.monthBar}>
        <button type="button" className={styles.nav} disabled={monthIndex <= 0} onClick={() => setMonth(months[monthIndex - 1] ?? month)} aria-label="החודש הקודם">
          <ChevronRight size={18} strokeWidth={1.25} aria-hidden="true" />
        </button>
        <span className={styles.monthName} aria-live="polite">
          {month && monthFormatter.format(new Date(`${month}-01T12:00:00Z`))}
        </span>
        <button type="button" className={styles.nav} disabled={monthIndex >= months.length - 1} onClick={() => setMonth(months[monthIndex + 1] ?? month)} aria-label="החודש הבא">
          <ChevronLeft size={18} strokeWidth={1.25} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.grid} role="group" aria-label="ימי החודש">
        {WEEKDAYS.map((name) => (
          <span key={name} className={styles.weekday} aria-hidden="true">
            {name}
          </span>
        ))}
        {Array.from({ length: month ? dayOfWeek(`${month}-01`) : 0 }, (_, i) => (
          <span key={`blank-${month}-${i}`} />
        ))}
        {monthDates(month).map((date) => (
          <DayCell key={date} date={date} day={byDate.get(date)} busy={busyDate === date} onToggle={toggle} />
        ))}
      </div>

      <ul role="list" className={styles.legend}>
        <li><span className={clsx(styles.swatch, styles.swatchOpen)} /> פתוח להזמנות</li>
        <li><span className={clsx(styles.swatch, styles.swatchBlocked)} /> חסמת</li>
        <li><span className={clsx(styles.swatch, styles.swatchCustom)} /> שעות מיוחדות</li>
        <li><span className={clsx(styles.swatch, styles.swatchAuto)} /> סגור אוטומטית (שישי, שבת, חג)</li>
      </ul>

      {message && (
        <p role={message.ok ? "status" : "alert"} className={message.ok ? styles.success : styles.error}>
          {message.text}
        </p>
      )}
    </div>
  );
}

function monthDates(month: string): string[] {
  if (!month) return [];
  const [y, m] = month.split("-").map(Number);
  const count = new Date(Date.UTC(y ?? 0, m ?? 1, 0)).getUTCDate();
  return Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
}
