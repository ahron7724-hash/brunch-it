import { Checkbox } from "@/components/ui/Checkbox/Checkbox";
import { Field } from "@/components/ui/Field/Field";
import type { AdminProduct } from "@/lib/admin/products";
import { DIET_LABELS } from "@/lib/data/types";
import { DIET_TAGS } from "@/lib/validation/content";

import styles from "./ProductDetailsFields.module.css";

type ProductDetailsFieldsProps = {
  product: AdminProduct;
  categories: { id: string; name: string }[];
  defaultLeadTimeHours: number;
};

/** Details, categories and visibility fields of the product form (saved with the single save button). */
export function ProductDetailsFields({ product, categories, defaultLeadTimeHours }: ProductDetailsFieldsProps) {
  const selected = new Set(product.product_categories.map((c) => c.category_id));

  return (
    <div className={styles.fields}>
      <div className={styles.row}>
        <Field id="title" label="שם המוצר" maxLength={120} defaultValue={product.title} />
        <Field id="slug" label="כתובת בדף (אופציונלי)" maxLength={140} required={false} defaultValue={product.slug} hint="נוצרת אוטומטית מהשם אם משאירים ריק" />
      </div>
      <Field id="description" label="תיאור" multiline rows={5} maxLength={4000} required={false} defaultValue={product.description ?? ""} />
      <Field id="contents" label="מה בפנים" multiline rows={2} maxLength={2000} required={false} defaultValue={product.contents ?? ""} />
      <Field
        id="leadTimeHours"
        label="זמן הכנה מינימלי (שעות)"
        type="number"
        min={0}
        max={1440}
        required={false}
        maxLength={4}
        defaultValue={product.min_lead_time_hours ?? ""}
        hint={`ריק = ברירת המחדל של האתר (${defaultLeadTimeHours} שעות). 24 = יום, 48 = יומיים, 120 = 5 ימים.`}
      />

      <fieldset className={styles.group}>
        <legend className={styles.legend}>סימון תזונתי</legend>
        {DIET_TAGS.map((tag) => (
          <Checkbox key={tag} id={`diet-${tag}`} name="dietTags" value={tag} label={DIET_LABELS[tag]} defaultChecked={product.diet_tags.includes(tag)} />
        ))}
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>קטגוריות</legend>
        {categories.length === 0 && <p className={styles.note}>אין עדיין קטגוריות. אפשר להוסיף בעמוד &quot;קטגוריות&quot;.</p>}
        {categories.map((c) => (
          <Checkbox key={c.id} id={`cat-${c.id}`} name="categoryIds" value={c.id} label={c.name} defaultChecked={selected.has(c.id)} />
        ))}
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>כיתוב אישי</legend>
        <Checkbox id="allowsCustomText" name="allowsCustomText" label="הלקוח יכול להוסיף כיתוב" defaultChecked={product.allows_custom_text} />
        <Field id="customTextLabel" label="כותרת השדה" maxLength={80} required={false} defaultValue={product.custom_text_label ?? ""} hint="למשל: כיתוב על העוגה" />
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>הצגה באתר</legend>
        <Checkbox id="isActive" name="isActive" label="מוצג באתר" defaultChecked={product.is_active} />
        <Checkbox id="isFeatured" name="isFeatured" label="להציג בדף הבית (נבחרות)" defaultChecked={product.is_featured} />
        <Field id="sortOrder" label="סדר הופעה" type="number" min={0} max={10000} maxLength={5} defaultValue={product.sort_order} hint="מספר קטן מופיע קודם" />
      </fieldset>
    </div>
  );
}
