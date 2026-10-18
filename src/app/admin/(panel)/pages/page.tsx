import { AdminForm } from "@/components/admin/AdminForm/AdminForm";
import { AdminHeader } from "@/components/admin/AdminHeader/AdminHeader";
import { ImageField } from "@/components/admin/ImageField/ImageField";
import { MediaListEditor } from "@/components/admin/MediaListEditor/MediaListEditor";
import { Panel } from "@/components/admin/Panel/Panel";
import { Field } from "@/components/ui/Field/Field";
import { getAdminMedia } from "@/lib/admin/media";
import { getAboutPage, getKashrutPage } from "@/lib/data/content";

import { savePage } from "./actions";
import styles from "./pages.module.css";

const TEXT_HINT = "פסקאות מופרדות בשורה ריקה. שורה שמתחילה ב-## הופכת לכותרת.";

export default async function AdminPagesPage() {
  const [about, kashrut, media] = await Promise.all([getAboutPage(), getKashrutPage(), getAdminMedia()]);

  return (
    <>
      <AdminHeader title="אודות וכשרות" />

      <Panel title="עמוד אודות">
        <AdminForm action={savePage.bind(null, "about")}>
          <Field id="about-title" name="title" label="כותרת" maxLength={120} defaultValue={about?.title ?? "אודות"} />
          <ImageField name="heroImageUrl" label="תמונת אווירה" folder="pages" defaultUrl={about?.heroImageUrl ?? null} />
          <Field id="about-body" name="bodyText" label="הסיפור שלכם" multiline rows={12} maxLength={50000} required={false} defaultValue={about?.bodyText ?? ""} hint={TEXT_HINT} />
        </AdminForm>
      </Panel>

      <Panel title="גלריית אירועים" description="מופיעה בעמוד אודות. לחיצה על תמונה מגדילה אותה.">
        <MediaListEditor list="gallery" items={media.gallery} folder="gallery" max={60} withCaption />
      </Panel>

      <Panel title="עמוד כשרות">
        <AdminForm action={savePage.bind(null, "kashrut")}>
          <div className={styles.row}>
            <Field id="kashrut-title" name="title" label="כותרת" maxLength={120} defaultValue={kashrut?.title ?? "כשרות"} />
            <Field id="supervision" label="השגחה" maxLength={200} required={false} defaultValue={kashrut?.supervision ?? ""} hint="למשל: רבנות מקומית – כשר חלבי, חלב ישראל" />
            <Field id="validUntil" label="תוקף התעודה" type="date" required={false} maxLength={10} defaultValue={kashrut?.validUntil ?? ""} />
          </div>
          <ImageField name="certificateUrl" label="תמונת תעודת הכשרות" folder="pages" defaultUrl={kashrut?.certificateUrl ?? null} hint="צילום ברור של התעודה העדכנית" />
          <ImageField name="heroImageUrl" label="תמונת אווירה (לא חובה)" folder="pages" defaultUrl={kashrut?.heroImageUrl ?? null} />
          <Field id="kashrut-body" name="bodyText" label="פירוט והנחיות" multiline rows={8} maxLength={50000} required={false} defaultValue={kashrut?.bodyText ?? ""} hint={TEXT_HINT} />
        </AdminForm>
      </Panel>
    </>
  );
}
