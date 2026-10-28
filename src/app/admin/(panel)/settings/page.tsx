import { AdminForm } from "@/components/admin/AdminForm/AdminForm";
import { AdminHeader } from "@/components/admin/AdminHeader/AdminHeader";
import { ImageField } from "@/components/admin/ImageField/ImageField";
import { Panel } from "@/components/admin/Panel/Panel";
import { Checkbox } from "@/components/ui/Checkbox/Checkbox";
import { ColorField } from "@/components/ui/ColorField/ColorField";
import { Field } from "@/components/ui/Field/Field";
import { Select } from "@/components/ui/Select/Select";
import { FONT_KEYS } from "@/lib/settings/defaults";
import { getSettings } from "@/lib/settings/get-settings";
import { FONT_OPTIONS } from "@/lib/theme/fonts";

import { saveSettings } from "./actions";
import styles from "./settings.module.css";

export default async function SettingsPage() {
  const s = await getSettings();

  return (
    <>
      <AdminHeader title="עיצוב ופרטי העסק" description="כל השינויים נשמרים יחד בלחיצה על &quot;שמירה&quot; בתחתית." />

      <AdminForm action={saveSettings} className={styles.form}>
        <Panel title="מיתוג">
          <div className={styles.row}>
            <Field id="businessName" label="שם העסק" maxLength={60} defaultValue={s.businessName} />
            <Field id="tagline" label="שורת תיאור מתחת לשם" maxLength={80} required={false} defaultValue={s.tagline} />
          </div>
          <ImageField name="logoUrl" label="לוגו (לא חובה)" folder="brand" defaultUrl={s.logoUrl} hint="בלי לוגו, שם העסק מוצג כטקסט. מומלץ PNG עם רקע שקוף." />
        </Panel>

        <Panel title="צבעים ופונט" description="שאר הגוונים באתר (קווים, טקסט משני, ריחוף) מחושבים אוטומטית מהצבעים האלה.">
          <div className={styles.row}>
            <ColorField id="primary" label="כפתורים" defaultValue={s.colors.primary} />
            <ColorField id="accent" label="הדגשה" defaultValue={s.colors.accent} hint="תוויות, קווים, כוכבים" />
            <ColorField id="background" label="רקע" defaultValue={s.colors.background} />
            <ColorField id="surface" label="רקע משני" defaultValue={s.colors.surface} />
            <ColorField id="textColor" label="טקסט" defaultValue={s.colors.text} />
          </div>
          <Select id="font" label="פונט" defaultValue={s.font} options={FONT_KEYS.map((key) => ({ value: key, label: FONT_OPTIONS[key].label }))} />
        </Panel>

        <Panel title="באנר ראשי בדף הבית">
          <Field id="heroEyebrow" label="שורה קטנה מעל הכותרת" maxLength={60} required={false} defaultValue={s.heroEyebrow} />
          <Field id="heroTitle" label="כותרת ראשית" maxLength={120} defaultValue={s.heroTitle} />
          <Field id="heroSubtitle" label="כותרת משנה" multiline rows={2} maxLength={300} required={false} defaultValue={s.heroSubtitle} />
          <Checkbox id="headerOnScroll" name="headerOnScroll" label="להסתיר את התפריט העליון בראש דף הבית, ולהציג אותו רק בגלילה" defaultChecked={s.headerOnScroll} />
        </Panel>

        <Panel title="פרטי קשר והזמנות">
          <div className={styles.row}>
            <Field id="orderEmail" label="דוא״ל לקבלת הזמנות" type="email" dir="ltr" maxLength={254} required={false} defaultValue={s.orderEmail} />
            <Field id="phone" label="טלפון" type="tel" dir="ltr" maxLength={20} required={false} defaultValue={s.phone} />
            <Field id="whatsapp" label="וואטסאפ" type="tel" dir="ltr" maxLength={20} required={false} defaultValue={s.whatsapp} />
          </div>
          <div className={styles.row}>
            <Field id="pickupAddress" label="כתובת לאיסוף עצמי" maxLength={200} required={false} defaultValue={s.pickupAddress} />
            <Field id="pickupMapUrl" label="קישור למפה" type="url" dir="ltr" maxLength={2048} required={false} defaultValue={s.pickupMapUrl} hint="קישור מגוגל מפות או Waze" />
          </div>
          <Field id="kashrutLine" label="שורת כשרות (בתחתית ובדף הבית)" maxLength={120} required={false} defaultValue={s.kashrutLine} hint="למשל: כשר חלבי, חלב ישראל" />
        </Panel>

        <Panel title="מינימום הזמנה למוצרים" description="סכום מינימלי למוצרים בהזמנה. המגשים לא נספרים, והזמנה של מגשים בלבד לא צריכה לעמוד במינימום.">
          <Field
            id="productsMinOrder"
            label="מינימום למוצרים (₪)"
            type="number"
            min={0}
            max={100000}
            maxLength={6}
            required={false}
            defaultValue={s.productsMinOrder}
            hint="0 = ללא מינימום"
          />
        </Panel>
      </AdminForm>
    </>
  );
}
