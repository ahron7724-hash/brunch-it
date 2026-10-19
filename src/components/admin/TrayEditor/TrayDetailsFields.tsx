import { ImageField } from "@/components/admin/ImageField/ImageField";
import { Checkbox } from "@/components/ui/Checkbox/Checkbox";
import { Field } from "@/components/ui/Field/Field";
import type { AdminTray } from "@/lib/admin/trays";

import styles from "./TrayEditor.module.css";

type TrayDetailsFieldsProps = { tray: AdminTray; defaultLeadTimeHours: number };

/** Title, image, description and visibility of the tray form (saved with the single save button). */
export function TrayDetailsFields({ tray, defaultLeadTimeHours }: TrayDetailsFieldsProps) {
  return (
    <div className={styles.fields}>
      <div className={styles.row}>
        <Field id="title" label="שם המגש" maxLength={120} defaultValue={tray.title} />
        <Field id="slug" label="כתובת בדף (אופציונלי)" maxLength={140} required={false} defaultValue={tray.slug} hint="נוצרת אוטומטית מהשם אם משאירים ריק" />
      </div>
      <ImageField name="imageUrl" label="תמונה לריבוע בדף הבית" folder="trays" defaultUrl={tray.image_url} hint="תמונה ריבועית נראית הכי טוב" />
      <Field id="description" label="תיאור קצר" multiline rows={3} maxLength={2000} required={false} defaultValue={tray.description ?? ""} />
      <div className={styles.row}>
        <Field
          id="leadTimeHours"
          label="זמן הכנה מינימלי (שעות)"
          type="number"
          min={0}
          max={1440}
          required={false}
          maxLength={4}
          defaultValue={tray.min_lead_time_hours ?? ""}
          hint={`ריק = ברירת המחדל של האתר (${defaultLeadTimeHours} שעות).`}
        />
        <Field id="sortOrder" label="סדר הופעה" type="number" min={0} max={10000} maxLength={5} defaultValue={tray.sort_order} />
      </div>
      <Checkbox id="isActive" name="isActive" label="מוצג באתר" defaultChecked={tray.is_active} />
    </div>
  );
}
