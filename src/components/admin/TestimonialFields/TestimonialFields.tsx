import { Checkbox } from "@/components/ui/Checkbox/Checkbox";
import { Field } from "@/components/ui/Field/Field";
import { Select } from "@/components/ui/Select/Select";

import styles from "./TestimonialFields.module.css";

type TestimonialFieldsProps = {
  idPrefix: string;
  values?: { clientName: string; eventLabel: string; content: string; rating: number; sortOrder: number; isPublished: boolean };
};

const RATINGS = [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: "★".repeat(n) }));

export function TestimonialFields({ idPrefix, values }: TestimonialFieldsProps) {
  return (
    <>
      <div className={styles.row}>
        <Field id={`${idPrefix}-clientName`} name="clientName" label="שם הלקוח" maxLength={80} defaultValue={values?.clientName} hint="למשל: מיכל א." />
        <Field id={`${idPrefix}-eventLabel`} name="eventLabel" label="סוג האירוע" maxLength={80} required={false} defaultValue={values?.eventLabel} />
        <Select id={`${idPrefix}-rating`} name="rating" label="דירוג" options={RATINGS} defaultValue={String(values?.rating ?? 5)} />
      </div>
      <Field id={`${idPrefix}-content`} name="content" label="ההמלצה" multiline rows={3} maxLength={1000} defaultValue={values?.content} />
      {values && (
        <div className={styles.row}>
          <Field id={`${idPrefix}-sortOrder`} name="sortOrder" label="סדר הופעה" type="number" min={0} max={10000} maxLength={5} defaultValue={values.sortOrder} />
          <Checkbox id={`${idPrefix}-isPublished`} name="isPublished" label="מוצגת באתר" defaultChecked={values.isPublished} />
        </div>
      )}
    </>
  );
}
