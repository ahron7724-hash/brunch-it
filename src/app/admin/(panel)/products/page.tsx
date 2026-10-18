import { AdminForm } from "@/components/admin/AdminForm/AdminForm";
import { AdminHeader } from "@/components/admin/AdminHeader/AdminHeader";
import { Panel } from "@/components/admin/Panel/Panel";
import { ProductListItem } from "@/components/admin/ProductListItem/ProductListItem";
import { Field } from "@/components/ui/Field/Field";
import { listAdminProducts } from "@/lib/admin/products";

import { createProduct } from "./actions";
import styles from "./products.module.css";

export default async function AdminProductsPage() {
  const products = await listAdminProducts();

  return (
    <>
      <AdminHeader title="מוצרים" description="לחצו על מוצר כדי לערוך אותו: תמונות, גדלים ומחירים, טעמים ופרטים." />

      <Panel title="מוצר חדש" description="אחרי היצירה תגיעו לעמוד העריכה, שם מוסיפים תמונות, גדלים ומחירים.">
        <AdminForm action={createProduct} submitLabel="יצירת מוצר">
          <Field id="title" label="שם המוצר" maxLength={120} />
        </AdminForm>
      </Panel>

      {products.length === 0 ? (
        <p className={styles.empty}>עדיין אין מוצרים. צרו את המוצר הראשון למעלה.</p>
      ) : (
        <ul role="list" className={styles.list} aria-label="רשימת המוצרים">
          {products.map((product) => (
            <ProductListItem key={product.id} product={product} />
          ))}
        </ul>
      )}
    </>
  );
}
