import { AdminForm } from "@/components/admin/AdminForm/AdminForm";
import { AdminHeader } from "@/components/admin/AdminHeader/AdminHeader";
import { CategoryDelete } from "@/components/admin/CategoryDelete/CategoryDelete";
import { ImageField } from "@/components/admin/ImageField/ImageField";
import { Panel } from "@/components/admin/Panel/Panel";
import { Checkbox } from "@/components/ui/Checkbox/Checkbox";
import { Field } from "@/components/ui/Field/Field";
import { listAdminCategories } from "@/lib/admin/products";

import { createCategory, updateCategory } from "./actions";
import styles from "./categories.module.css";

export default async function AdminCategoriesPage() {
  const categories = await listAdminCategories();

  return (
    <>
      <AdminHeader title="קטגוריות" description="מוצר יכול להופיע בכמה קטגוריות. משייכים מוצרים לקטגוריות בעמוד העריכה של המוצר." />

      <Panel title="קטגוריה חדשה">
        <AdminForm action={createCategory} submitLabel="הוספת קטגוריה" resetOnSuccess>
          <div className={styles.row}>
            <Field id="new-name" name="name" label="שם" maxLength={80} />
            <Field id="new-sortOrder" name="sortOrder" label="סדר הופעה" type="number" min={0} max={10000} maxLength={5} defaultValue={categories.length + 1} />
          </div>
          <Field id="new-description" name="description" label="תיאור קצר" multiline rows={2} maxLength={1000} required={false} />
          <ImageField name="imageUrl" label="תמונה" folder="categories" defaultUrl={null} />
        </AdminForm>
      </Panel>

      {categories.map((c) => (
        <Panel key={c.id} title={c.name} description={c.is_active ? `/category/${c.slug}` : "מוסתרת"}>
          <AdminForm action={updateCategory.bind(null, c.id)}>
            <div className={styles.row}>
              <Field id={`name-${c.id}`} name="name" label="שם" maxLength={80} defaultValue={c.name} />
              <Field id={`slug-${c.id}`} name="slug" label="כתובת" maxLength={100} defaultValue={c.slug} />
              <Field id={`sortOrder-${c.id}`} name="sortOrder" label="סדר הופעה" type="number" min={0} max={10000} maxLength={5} defaultValue={c.sort_order} />
            </div>
            <Field id={`description-${c.id}`} name="description" label="תיאור קצר" multiline rows={2} maxLength={1000} required={false} defaultValue={c.description ?? ""} />
            <ImageField name="imageUrl" label="תמונה" folder="categories" defaultUrl={c.image_url} />
            <Checkbox id={`active-${c.id}`} name="isActive" label="מוצגת באתר" defaultChecked={c.is_active} />
          </AdminForm>
          <CategoryDelete categoryId={c.id} />
        </Panel>
      ))}
    </>
  );
}
