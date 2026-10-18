import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/content/LegalPage/LegalPage";
import { formatLeadTime } from "@/lib/leadTime";
import { getSettings } from "@/lib/settings/get-settings";

export const metadata: Metadata = { title: "תקנון" };

export default async function TermsPage() {
  const settings = await getSettings();

  return (
    <LegalPage title="תקנון" updated="אוקטובר 2026">
      <LegalSection title="כללי">
        <p>
          האתר מופעל על ידי {settings.businessName}. ביצוע הזמנה באתר מהווה הסכמה לתנאים שלהלן.
        </p>
      </LegalSection>

      <LegalSection title="הזמנות">
        <ul>
          <li>
            כל המוצרים מוכנים בהזמנה מראש בלבד. ככלל יש להזמין לפחות {formatLeadTime(settings.defaultLeadTimeHours)} לפני
            מועד האיסוף. לחלק מהמוצרים נדרש זמן הכנה ארוך יותר, כמצוין בעמוד המוצר.
          </li>
          <li>ההזמנה נחשבת סופית לאחר שקיבלתם מאיתנו אישור.</li>
          <li>אין איסוף ומשלוחים בימי שישי, שבת וחגי ישראל.</li>
        </ul>
      </LegalSection>

      <LegalSection title="מחירים ותשלום">
        <p>המחירים באתר כוללים מע״מ. אופן התשלום יתואם איתכם לאחר אישור ההזמנה.</p>
      </LegalSection>

      <LegalSection title="ביטול ושינוי הזמנה">
        <p>
          ניתן לבטל או לשנות הזמנה עד {formatLeadTime(settings.defaultLeadTimeHours)} לפני מועד האיסוף, בפנייה אלינו.
          לאחר מכן ייתכן שהמוצרים כבר בהכנה, ולא נוכל לבטל.
        </p>
      </LegalSection>

      <LegalSection title="איסוף ומשלוח">
        <p>
          יש להגיע לאיסוף בחלון הזמן שנבחר. מוצרים שלא נאספו בזמן יישמרו עד סוף אותו יום. במשלוח, דמי המשלוח מוצגים
          בקופה לפי אזור.
        </p>
      </LegalSection>

      <LegalSection title="אלרגנים">
        <p>
          המוצרים מיוצרים במטבח שבו יש חיטה, ביצים, חלב, אגוזים ושומשום. ייתכנו עקבות גם במוצרים שאינם מכילים אותם.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
