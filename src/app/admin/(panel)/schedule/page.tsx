import { z } from "zod";

import { AdminForm } from "@/components/admin/AdminForm/AdminForm";
import { AdminHeader } from "@/components/admin/AdminHeader/AdminHeader";
import { BlockCalendar } from "@/components/admin/BlockCalendar/BlockCalendar";
import { OverrideList } from "@/components/admin/OverrideList/OverrideList";
import { Panel } from "@/components/admin/Panel/Panel";
import { WeekdaySlots } from "@/components/admin/WeekdaySlots/WeekdaySlots";
import { Checkbox } from "@/components/ui/Checkbox/Checkbox";
import { Field } from "@/components/ui/Field/Field";
import { getAdminCalendar } from "@/lib/admin/calendar";
import { israelToday } from "@/lib/booking/time";
import { getSettings } from "@/lib/settings/get-settings";
import { createClient } from "@/lib/supabase/server";
import { parseRows } from "@/lib/validation/content";

import { saveDateOverride, saveLeadTime } from "./actions";
import styles from "./schedule.module.css";

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי"];
const time = z.string().transform((t) => t.slice(0, 5));

export default async function SchedulePage() {
  const supabase = await createClient();
  const today = israelToday();
  const [calendar, settings, weeklyRes, overridesRes] = await Promise.all([
    getAdminCalendar(),
    getSettings(),
    supabase.from("time_slot_settings").select("day_of_week, slot_start, slot_end").order("slot_start"),
    supabase.from("date_overrides").select("id, override_date, is_blocked, custom_slots, note").gte("override_date", today).order("override_date"),
  ]);
  const weekly = parseRows(z.object({ day_of_week: z.number(), slot_start: time, slot_end: time }), weeklyRes.data);
  const overrides = parseRows(
    z.object({
      id: z.string().uuid(),
      override_date: z.string(),
      is_blocked: z.boolean(),
      custom_slots: z.array(z.object({ start: z.string(), end: z.string() })).nullable().catch(null),
      note: z.string().nullable(),
    }),
    overridesRes.data
  );

  return (
    <>
      <AdminHeader title="מועדי איסוף" description="שישי, שבת וחגי ישראל חסומים אוטומטית." />

      <Panel title="יומן" description="לחיצה על יום חוסמת אותו (למשל כשהוא כבר מלא), לחיצה נוספת פותחת אותו מחדש. על כל יום מופיע מספר ההזמנות שכבר יש בו.">
        <BlockCalendar days={calendar} />
      </Panel>

      <Panel title="זמן הכנה כללי" description="כמה זמן מראש צריך להזמין, לכל מוצר שלא הוגדר לו זמן משלו.">
        <AdminForm action={saveLeadTime}>
          <Field id="defaultLeadTimeHours" label="שעות" type="number" min={0} max={1440} maxLength={4} defaultValue={settings.defaultLeadTimeHours} hint="24 = יום, 48 = יומיים" />
        </AdminForm>
      </Panel>

      <Panel title="חלונות איסוף קבועים" description="השעות שבהן אפשר לאסוף בכל יום בשבוע. יום בלי שעות סגור לאיסוף.">
        {DAYS.map((name, day) => {
          const slots = weekly.filter((s) => s.day_of_week === day).map((s) => ({ start: s.slot_start, end: s.slot_end }));
          return (
            <div key={name} className={styles.day}>
              <h3 className={styles.dayName}>יום {name}</h3>
              <WeekdaySlots dayOfWeek={day} slots={slots} />
            </div>
          );
        })}
      </Panel>

      <Panel title="שעות מיוחדות לתאריך מסוים" description="שעות איסוף שונות ביום מסוים, או חסימה עם הערה מפורטת.">
        <AdminForm action={saveDateOverride} submitLabel="שמירת התאריך">
          <div className={styles.row}>
            <Field id="date" label="תאריך" type="date" min={today} maxLength={10} />
            <Field id="note" label="הערה ללקוחות (למשל: חופשה)" maxLength={200} required={false} />
          </div>
          <Checkbox id="isBlocked" name="isBlocked" label="חסימת היום כולו" />
          <p className={styles.hint}>או שעות מיוחדות ליום הזה:</p>
          <div className={styles.row}>
            <Field id="slot1Start" label="חלון 1 – מ" type="time" required={false} maxLength={5} />
            <Field id="slot1End" label="עד" type="time" required={false} maxLength={5} />
            <Field id="slot2Start" label="חלון 2 – מ" type="time" required={false} maxLength={5} />
            <Field id="slot2End" label="עד" type="time" required={false} maxLength={5} />
          </div>
        </AdminForm>
        <OverrideList items={overrides.map((o) => ({ id: o.id, date: o.override_date, isBlocked: o.is_blocked, slots: o.custom_slots ?? [], note: o.note }))} />
      </Panel>
    </>
  );
}
