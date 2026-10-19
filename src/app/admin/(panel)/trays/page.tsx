import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";

import { AdminForm } from "@/components/admin/AdminForm/AdminForm";
import { AdminHeader } from "@/components/admin/AdminHeader/AdminHeader";
import { Panel } from "@/components/admin/Panel/Panel";
import { Field } from "@/components/ui/Field/Field";
import { listAdminTrays } from "@/lib/admin/trays";

import { createTray } from "./actions";
import styles from "./trays.module.css";

export default async function AdminTraysPage() {
  const trays = await listAdminTrays();

  return (
    <>
      <AdminHeader
        title="מגשים"
        description="מגשים שהלקוח ממלא בעצמו (עוגיות, סופגניות…). מוצגים בשורה בדף הבית, ובלחיצה נפתח דף המילוי."
      />

      <Panel title="מגש חדש" description="אחרי היצירה תגיעו לעמוד העריכה, שם מוסיפים גדלים, פריטים ומחירים.">
        <AdminForm action={createTray} submitLabel="יצירת מגש">
          <Field id="title" label="שם המגש" maxLength={120} />
        </AdminForm>
      </Panel>

      {trays.length === 0 ? (
        <p className={styles.empty}>עדיין אין מגשים. צרו את הראשון למעלה, למשל ״מגש עוגיות״.</p>
      ) : (
        <ul role="list" className={styles.list} aria-label="רשימת המגשים">
          {trays.map((tray) => (
            <li key={tray.id} className={clsx(styles.item, !tray.is_active && styles.inactive)}>
              <span className={styles.thumb}>
                {tray.image_url && <Image src={tray.image_url} alt="" fill sizes="5rem" className={styles.image} />}
              </span>
              <div className={styles.info}>
                <h2 className={styles.title}>
                  {/* The link's ::after covers the card, so clicking anywhere opens the editor. */}
                  <Link href={`/admin/trays/${tray.id}`} className={styles.cardLink}>
                    {tray.title}
                  </Link>
                </h2>
                <p className={styles.meta}>
                  <span className={tray.is_active ? styles.shown : styles.hidden}>{tray.is_active ? "מוצג באתר" : "מוסתר"}</span>
                  {" · "}
                  {tray.tray_sizes.length} גדלים · {tray.tray_items.filter((i) => i.is_active).length} פריטים
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
