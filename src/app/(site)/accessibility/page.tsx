import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/content/LegalPage/LegalPage";
import { mailtoHref, telHref } from "@/lib/security/safeHref";
import { getSettings } from "@/lib/settings/get-settings";

export const metadata: Metadata = { title: "הצהרת נגישות" };

export default async function AccessibilityPage() {
  const settings = await getSettings();
  const phone = telHref(settings.phone);
  const email = mailtoHref(settings.orderEmail);

  return (
    <LegalPage title="הצהרת נגישות" updated="אוקטובר 2026">
      <LegalSection title="מחויבות לנגישות">
        <p>
          {settings.businessName} רואה חשיבות במתן שירות שוויוני לכלל הלקוחות, ופועלת להנגשת האתר בהתאם לתקן הישראלי
          ת״י 5568 ולהנחיות WCAG 2.1 ברמה AA.
        </p>
      </LegalSection>

      <LegalSection title="מה נעשה באתר">
        <ul>
          <li>ניווט מלא באמצעות המקלדת, עם סימון ברור של הרכיב הפעיל.</li>
          <li>קישור &quot;דלג לתוכן&quot; בראש כל עמוד.</li>
          <li>טקסט חלופי לתמונות, ומבנה כותרות תקין.</li>
          <li>ניגודיות צבעים מספקת בין טקסט לרקע.</li>
          <li>אפשרות לעצור תמונות נעות, וכיבוד הגדרת &quot;הפחתת תנועה&quot; של מערכת ההפעלה.</li>
          <li>תוויות לכל שדות הטפסים והודעות שגיאה ברורות.</li>
          <li>התאמה לגדלי מסך שונים ולהגדלת טקסט עד 200%.</li>
        </ul>
      </LegalSection>

      <LegalSection title="נתקלתם בבעיה?">
        <p>אם מצאתם רכיב שאינו נגיש, נשמח לשמוע ולתקן. פנו אלינו ונחזור אליכם בהקדם.</p>
        {(phone || email) && (
          <ul>
            {phone && (
              <li>
                טלפון:{" "}
                <a href={phone} className="ltr">
                  {settings.phone}
                </a>
              </li>
            )}
            {email && (
              <li>
                דוא״ל:{" "}
                <a href={email} className="ltr">
                  {settings.orderEmail}
                </a>
              </li>
            )}
          </ul>
        )}
      </LegalSection>
    </LegalPage>
  );
}
