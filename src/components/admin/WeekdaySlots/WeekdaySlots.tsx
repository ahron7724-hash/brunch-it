"use client";

import { saveWeekdaySlots } from "@/app/admin/(panel)/schedule/actions";
import { RowsEditor } from "@/components/admin/RowsEditor/RowsEditor";

type WeekdaySlotsProps = { dayOfWeek: number; slots: { start: string; end: string }[] };

export function WeekdaySlots({ dayOfWeek, slots }: WeekdaySlotsProps) {
  return (
    <RowsEditor
      columns={[
        { key: "start", label: "משעה", type: "time", dir: "ltr" },
        { key: "end", label: "עד שעה", type: "time", dir: "ltr" },
      ]}
      initialRows={slots}
      maxRows={6}
      addLabel="הוספת חלון"
      emptyText="סגור לאיסוף ביום הזה."
      onSave={(rows) => saveWeekdaySlots(dayOfWeek, rows)}
    />
  );
}
