import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/content/LegalPage/LegalPage";
import { getSettings } from "@/lib/settings/get-settings";

export const metadata: Metadata = { title: "מדיניות פרטיות" };

export default async function PrivacyPage() {
  const settings = await getSettings();

  return (
    <LegalPage title="מדיניות פרטיות" updated="אוקטובר 2026">
      <LegalSection title="איזה מידע נאסף">
        <p>בעת ביצוע הזמנה אנו מבקשים שם מלא, טלפון, כתובת דוא״ל, ובמשלוח גם כתובת למשלוח. ניתן להוסיף הערות להזמנה.</p>
        <p>לא נאסף באתר מידע על אמצעי תשלום.</p>
      </LegalSection>

      <LegalSection title="למה משמש המידע">
        <ul>
          <li>טיפול בהזמנה, תיאום האיסוף או המשלוח, ויצירת קשר בנוגע להזמנה.</li>
          <li>שליחת אישור הזמנה בדוא״ל.</li>
        </ul>
        <p>המידע אינו נמסר לצדדים שלישיים, למעט ספקי שירות הנדרשים לתפעול האתר (אחסון ושליחת דוא״ל).</p>
      </LegalSection>

      <LegalSection title="שמירה במכשיר שלכם">
        <p>
          סל הקניות ומועד האיסוף שבחרתם נשמרים בדפדפן שלכם בלבד (localStorage), כדי שלא יאבדו ברענון העמוד. האתר אינו
          משתמש בעוגיות פרסום או מעקב.
        </p>
      </LegalSection>

      <LegalSection title="זכויותיכם">
        <p>
          ניתן לבקש לעיין במידע שנשמר עליכם, לתקן אותו או למחוק אותו, בפנייה ל{settings.businessName} בפרטי הקשר
          שבתחתית האתר.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
