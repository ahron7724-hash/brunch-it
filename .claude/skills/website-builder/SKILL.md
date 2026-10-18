---
name: "website-builder"
description: "Build a website from scratch in VS Code: Next.js + Supabase for sites with data/auth, plain HTML/CSS/JS for a static one-pager. Plain CSS (no Tailwind), Hebrew/RTL, accessible, SEO-ready, strict secure React components."
---

# בניית אתר

סקיל לבניית אתר מלא בתוך פרויקט ב-VS Code, מאפיון ועד אתר שרץ ועובר build.

**סדר עדיפויות:** אבטחה ובדיקת קלט > תקינות קוד React > נגישות > עיצוב. בכל סתירה – הכלל המחמיר גובר.

**עיצוב:** כל ענייני העיצוב (CSS, פריסה, צבעים, טיפוגרפיה, RTL) מנוהלים לפי הסקיל `web-design-css`. CSS נקי בלבד – **ללא Tailwind**, ללא CSS-in-JS, ללא עיצוב inline. פריסה ב-flex כברירת מחדל.

לפני כל יצירה או שינוי של קומפוננטה – עבור על **רפרנס A (בניית קומפוננטה)** ו**רפרנס B (אבטחה ובדיקת קלט)** שבסוף הקובץ, וסיים ברשימת הבדיקה שלהם.

---

## שלב 1 – אפיון קצר לפני כתיבת קוד

ודא שיש תשובות (שאל רק מה שלא ברור, עד 4 שאלות):

1. מטרת האתר וקהל היעד.
2. אילו עמודים / אזורים נדרשים.
3. האם צריך מסד נתונים, התחברות, טפסים שנשמרים, ממשק ניהול?
4. מיתוג ואופי עיצובי (ראה `web-design-css`).
5. שפה – ברירת מחדל עברית (RTL).

הצג תוכנית קצרה (עמודים, קומפוננטות עיקריות, טבלאות) וקבל אישור.

## שלב 2 – בחירת טכנולוגיה

**דף אחד בלי שרת ובלי מסד נתונים** → HTML + CSS + JS נקי:
```
index.html
assets/css/reset.css
assets/css/tokens.css
assets/css/style.css
assets/js/main.js
assets/img/
```
גם כאן חלים כללי רפרנס B: בלי `innerHTML`, בלי שרשור מחרוזות, ובדיקת קלט בכל פונקציה. בניית DOM דרך `document.createElement` + `textContent`.

**כל מקרה אחר** → Next.js (App Router, TypeScript strict) + Supabase + CSS Modules:
```bash
npx create-next-app@latest <name> --typescript --no-tailwind --eslint --app --src-dir --import-alias "@/*"
npm install @supabase/supabase-js @supabase/ssr zod clsx server-only
```
מבנה:
```
src/app/                    עמודים, layout, actions.ts, route handlers
src/styles/                 reset.css, tokens.css, globals.css
src/components/ui/          רכיבים בסיסיים (Button, Input...)
src/components/sections/    אזורי עמוד (Hero, Footer...)
src/components/<Feature>/   קומפוננטה + קובץ .module.css שלה
src/lib/supabase/           client.ts, server.ts, middleware.ts
src/lib/validation/         סכמות zod (מקור אמת יחיד לקלט)
src/lib/security/           safeHref, safeRedirect
supabase/migrations/        קבצי SQL
design-system.md            החלטות עיצוב (ראה web-design-css)
```
ב-`tsconfig.json`: `"strict": true`, `"noUncheckedIndexedAccess": true`.

מיד אחרי יצירת הפרויקט:
- מחק את עיצוב ברירת המחדל של create-next-app (`page.module.css` ותוכן `globals.css`) והחלף בקבצי הבסיס מ-`web-design-css`.
- הוסף את כללי ESLint מרפרנס B.6 ואת כותרות האבטחה מרפרנס B.7.

## שלב 3 – כללי Next.js

- Server Components כברירת מחדל; `"use client"` רק כשצריך state/אירועים, וכמה שיותר נמוך בעץ.
- שינויי נתונים דרך Server Actions / Route Handlers – תמיד עם ולידציה ובדיקת הרשאה בצד השרת (רפרנס B.2).
- `next/image`, `next/font` (עם subset `hebrew`), `next/link`.
- `loading.tsx`, `error.tsx`, `not-found.tsx`.
- metadata לכל עמוד.

## שלב 4 – כללי Supabase

- `@supabase/ssr` עם client נפרד לשרת ולדפדפן, ו-middleware לרענון session.
- משתני סביבה ב-`.env.local` בלבד + `.env.example` בלי ערכים.
- **אסור** לחשוף `SUPABASE_SERVICE_ROLE_KEY` לקוד לקוח או למשתנה `NEXT_PUBLIC_`. קבצים שמשתמשים בו מתחילים ב-`import "server-only";`.
- כל טבלה: `enable row level security` + policies מפורשות. אף טבלה בלי RLS.
- אילוצים במסד (`check`, `not null`, אורך מקסימלי) – שכבת הגנה נוספת מעבר ל-zod.
- כל שינוי סכמה כ-migration ב-`supabase/migrations/`.
- טיפוסים: `npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts`.
- שאילתות רק דרך ה-query builder או `rpc` עם פרמטרים (רפרנס B.3).

## שלב 5 – עיצוב, עברית ו-RTL

לפי `web-design-css`. בקצרה:
- `<html lang="he" dir="rtl">`.
- CSS Modules לכל קומפוננטה, טוקנים ב-`tokens.css`, פריסה ב-flex ו-`gap`.
- מאפיינים לוגיים בלבד (`margin-inline-start`, `inset-inline-end`, `text-align: start`).
- Mobile-first, צניעות בתמונות ובתוכן.
- טלפון, אימייל וקוד – בתוך `dir="ltr"`; תאריכים ומספרים עם `Intl` ו-`he-IL`.

## שלב 6 – נגישות (תקן 5568 / WCAG AA)

- HTML סמנטי, `h1` אחד לעמוד, היררכיית כותרות תקינה.
- `alt` לכל תמונה; ניגודיות 4.5:1.
- ניווט מלא במקלדת, focus נראה, קישור "דלג לתוכן".
- `label` לכל שדה, שגיאות מקושרות ב-`aria-describedby`, `aria-invalid`.
- עמוד "הצהרת נגישות" באתרים עסקיים/ארגוניים.

## שלב 7 – SEO וביצועים

- `title` ו-`description` לכל עמוד, Open Graph, favicon.
- `app/sitemap.ts`, `app/robots.ts`.
- תמונות דחוסות, lazy loading מתחת לקפל, בלי ספריות מיותרות.

## שלב 8 – בדיקה לפני סיום

אל תכריז שהאתר מוכן לפני שכל אלה עברו:

- `npm run lint` – 0 שגיאות (כולל כללי האבטחה מ-B.6).
- `npx tsc --noEmit` ו-`npm run build` – עוברים.
- סריקת דפוסים אסורים (רפרנס B.8) – תוצאה ריקה.
- רשימת הבדיקה העיצובית והסריקה מ-`web-design-css`.
- `npm audit --audit-level=high` – לטפל במה שעולה.
- `npm run dev`: כל העמודים נטענים; בדיקה ב-375 / 768 / 1280px בלי גלילה אופקית; RTL תקין.
- בכל טופס: ניסיון ידני עם קלט ריק, ארוך מדי, ו-`<script>alert(1)</script>` – צריך להידחות או להופיע כטקסט רגיל, לעולם לא לרוץ.
- Supabase: RLS פעיל בכל הטבלאות.

## שלב 9 – מסירה

`README.md` בעברית: הרצה מקומית, משתני סביבה ומאיפה מקבלים אותם, הרצת migrations, פריסה (Vercel ל-Next; Netlify / GitHub Pages לדף סטטי).
סיכום קצר למשתמש: מה נבנה, מה נשאר להשלים, הצעות לשלב הבא.

---
---

# רפרנס A – בניית קומפוננטת React חדשה

## A.1 סדר עבודה לכל קומפוננטה

1. **אחריות אחת.** אם צריך "וגם" כדי לתאר מה היא עושה – לפצל.
2. **שרת או לקוח?** ברירת מחדל Server Component. Client רק אם יש state, אירועים, או API של דפדפן.
3. **להגדיר טיפוס Props** – `type` מפורש, בלי `any`, שדות אופציונליים עם ברירת מחדל.
4. **לזהות גבולות קלט** – כל מידע שבא מהמשתמש, מה-URL, מהמסד, מ-API חיצוני או מ-storage → סכמת zod (רפרנס B.1).
5. **לכתוב** את הקומפוננטה + קובץ `.module.css` שלה, לפי כללי A.2–A.4 ו-`web-design-css`.
6. **לעבור על רשימת הבדיקה A.6** לפני שממשיכים.

## A.2 מבנה קובץ

- תיקייה לכל קומפוננטה: `ContactForm/ContactForm.tsx` + `ContactForm/ContactForm.module.css`.
- קומפוננטה אחת ייצואית לקובץ, שם קובץ = שם קומפוננטה ב-PascalCase.
- named export (`export function ContactForm`), לא default (מלבד page/layout של Next).
- סדר בתוך הקובץ: imports → types → קבועים → הקומפוננטה → עזרים פרטיים.
- מעל 150 שורות → לפצל.

## A.3 כללי React – חובה

**טוהר רינדור**
- הרינדור הוא פונקציה טהורה: אותם props/state → אותו JSX. בלי side effects, בלי `Math.random()`/`Date.now()` בגוף הרינדור.
- לעולם לא לשנות props או state ישירות (`arr.push`, `obj.x = ...`) – תמיד עותק חדש (`[...arr, x]`, `{ ...obj, x }`).

**Hooks**
- רק ברמה העליונה של הקומפוננטה – לא בתוך if/לולאה/פונקציה פנימית/אחרי return.
- מערך תלויות מלא ומדויק; לא משתיקים את `react-hooks/exhaustive-deps`.
- custom hook מתחיל ב-`use` ונמצא ב-`src/hooks/`.

**State**
- מינימום state. מה שאפשר לחשב מ-props/state קיימים – מחשבים ברינדור.
- עדכון לפי ערך קודם – צורת פונקציה: `setCount((c) => c + 1)`.
- state מורכב עם מעברים → `useReducer`.

**Effects**
- `useEffect` רק לסנכרון עם מערכת חיצונית (מנוי, טיימר, מאזין). לא לחישוב נתונים ולא לתגובה לאירוע משתמש (זה ב-handler).
- תמיד cleanup למאזינים/טיימרים/בקשות (`AbortController`).
- טעינת נתונים – עדיף ב-Server Component ולא ב-`useEffect`.

**רשימות**
- `key` יציב וייחודי מהנתונים (`item.id`). לא אינדקס ולא `Math.random()`.

**טפסים**
- עדיף `<form action={serverAction}>` + `useActionState`.
- שדה controlled או uncontrolled – לא לערבב באותו שדה.
- כפתור שליחה מנוטרל בזמן שליחה.

**בלי שרשור props (prop drilling)**
- מעבר prop דרך יותר מ-2 רמות שלא משתמשות בו – אסור. פתרונות לפי סדר: הרכבה (`children`), טעינת הנתון במקום שצריך (Server Component), ורק בסוף Context.

**ביצועים**
- `useMemo`/`useCallback`/`memo` רק כשיש בעיה מדידה או כשערך עובר כתלות ל-effect.

**נגישות**
- `button` לפעולה, `a`/`Link` לניווט – לא `div onClick`.
- כל כפתור אייקון עם `aria-label`.

**עיצוב**
- רק דרך קובץ ה-CSS Module של הקומפוננטה ומחלקות הפריסה הגלובליות (`stack`, `cluster` וכו'). אין `style={{}}` מלבד העברת משתנה CSS דינמי.

## A.4 איסור מוחלט על שרשור מחרוזות

אסור לחבר מחרוזות עם `+` בשום מקום. מעבר לזה, כל סוג מחרוזת מקבל כלי ייעודי:

| מה בונים | אסור | חובה |
|---|---|---|
| className | `styles.btn + " " + styles.active` או template literal | `clsx(styles.btn, isActive && styles.active)` |
| URL / query | `"/search?q=" + q` | `new URL(...)` + `URLSearchParams` |
| נתיב דינמי | `"/posts/" + id` | `` `/posts/${encodeURIComponent(id)}` `` אחרי ולידציה של id |
| טקסט לתצוגה | `"שלום " + name` | JSX: `<p>שלום {name}</p>` או template literal |
| HTML | כל בניית HTML ממחרוזת | JSX בלבד |
| SQL / פילטר Supabase | כל בנייה ממחרוזת | query builder / `rpc` עם פרמטרים |
| RegExp מקלט משתמש | `new RegExp(userInput)` | לא בונים regex מקלט; משתמשים ב-`includes` |
| קוד JS | כל הרצה של מחרוזת | אסור לחלוטין |

בניית URL נכונה:
```ts
const url = new URL("/search", window.location.origin);
url.searchParams.set("q", query);
url.searchParams.set("page", String(page));
router.push(`${url.pathname}${url.search}`);
```
הכלל `prefer-template` ב-ESLint (B.6) אוכף זאת אוטומטית.

## A.5 דוגמה מלאה – טופס יצירת קשר

`src/lib/validation/contact.ts`:
```ts
import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "שם קצר מדי").max(80, "שם ארוך מדי"),
  email: z.string().trim().email("כתובת אימייל לא תקינה").max(254),
  message: z.string().trim().min(10, "ההודעה קצרה מדי").max(2000, "ההודעה ארוכה מדי"),
  website: z.string().max(0).optional(), // honeypot – חייב להישאר ריק
});

export type ContactInput = z.infer<typeof contactSchema>;
```

`src/app/contact/actions.ts`:
```ts
"use server";

import { contactSchema } from "@/lib/validation/contact";
import { createClient } from "@/lib/supabase/server";

export type ContactState = {
  ok: boolean;
  message?: string;
  errors?: Partial<Record<"name" | "email" | "message", string[]>>;
};

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
    website: formData.get("website") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { website: _honeypot, ...data } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert(data);

  if (error) {
    console.error("contact insert failed", error.code);
    return { ok: false, message: "אירעה שגיאה, נסו שוב מאוחר יותר" };
  }
  return { ok: true, message: "ההודעה נשלחה, תודה!" };
}
```

`src/components/ContactForm/ContactForm.tsx`:
```tsx
"use client";

import { useActionState } from "react";
import clsx from "clsx";
import { submitContact, type ContactState } from "@/app/contact/actions";
import styles from "./ContactForm.module.css";

const initialState: ContactState = { ok: false };

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContact, initialState);

  return (
    <form action={formAction} noValidate className={clsx("stack", styles.form)}>
      <Field id="name" label="שם" maxLength={80} errors={state.errors?.name} />
      <Field id="email" label="אימייל" type="email" dir="ltr" maxLength={254} errors={state.errors?.email} />
      <Field id="message" label="הודעה" multiline maxLength={2000} errors={state.errors?.message} />

      {/* honeypot – נסתר מבני אדם, בוטים ממלאים */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className={styles.honeypot} aria-hidden="true" />

      <button type="submit" disabled={isPending} className={styles.submit}>
        {isPending ? "שולח..." : "שליחה"}
      </button>

      {state.message && (
        <p role="status" className={clsx(styles.status, state.ok ? styles.success : styles.error)}>
          {state.message}
        </p>
      )}
    </form>
  );
}

type FieldProps = {
  id: "name" | "email" | "message";
  label: string;
  maxLength: number;
  type?: "text" | "email";
  dir?: "ltr" | "rtl";
  multiline?: boolean;
  errors?: string[];
};

function Field({ id, label, maxLength, type = "text", dir, multiline = false, errors }: FieldProps) {
  const errorId = `${id}-error`;
  const hasError = Boolean(errors?.length);
  const common = {
    id,
    name: id,
    required: true,
    maxLength,
    dir,
    "aria-invalid": hasError,
    "aria-describedby": hasError ? errorId : undefined,
    className: clsx(styles.input, hasError && styles.inputError),
  };

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      {multiline ? <textarea rows={5} {...common} /> : <input type={type} {...common} />}
      {hasError && <p id={errorId} role="alert" className={styles.errorText}>{errors?.[0]}</p>}
    </div>
  );
}
```

`src/components/ContactForm/ContactForm.module.css`:
```css
.form { --stack-gap: var(--space-6); max-inline-size: 36rem; }

.field { display: flex; flex-direction: column; gap: var(--space-2); }

.label { font-weight: 600; }

.input {
  padding-block: var(--space-3);
  padding-inline: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
.input:focus-visible { border-color: var(--color-primary); }
.inputError { border-color: var(--color-error); }

.errorText { font-size: var(--text-sm); color: var(--color-error); }

.submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  min-block-size: 2.75rem;
  padding-inline: var(--space-8);
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-weight: 600;
}
.submit:hover { background: var(--color-primary-hover); }
.submit:disabled { opacity: 0.55; cursor: not-allowed; }

.status { font-weight: 500; }
.success { color: var(--color-success); }
.error { color: var(--color-error); }

.honeypot {
  position: absolute;
  inset-inline-start: -10000px;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
}
```

Migration מתאים:
```sql
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) <= 254),
  message text not null check (char_length(message) between 10 and 2000),
  created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
create policy "anyone can insert" on public.contact_messages
  for insert to anon, authenticated with check (true);
-- אין policy ל-select: אף אחד מהציבור לא יכול לקרוא הודעות
```

## A.6 רשימת בדיקה לכל קומפוננטה (לעבור עליה בפועל)

- [ ] Props מטופסים, אין `any`, אין `as` לעקיפת טיפוסים.
- [ ] Server Component אם אפשר; `"use client"` מוצדק.
- [ ] Hooks ברמה העליונה, תלויות מלאות, cleanup בכל effect.
- [ ] אין שינוי ישיר של props/state; אין state מיותר.
- [ ] `key` יציב מהנתונים.
- [ ] אין prop drilling מעבר ל-2 רמות.
- [ ] **אין שרשור מחרוזות עם `+`**; className דרך `clsx`; URL דרך `URL`/`URLSearchParams`.
- [ ] **כל פונקציה שמקבלת קלט חיצוני מאמתת אותו ב-zod** (רפרנס B.1).
- [ ] אין `dangerouslySetInnerHTML`, `eval`, `innerHTML` (רפרנס B.4).
- [ ] כל `href`/`src` דינמי עובר דרך `safeHref` (רפרנס B.5).
- [ ] הודעות שגיאה למשתמש בעברית, בלי פרטים טכניים פנימיים.
- [ ] עיצוב ב-CSS Module בלבד, flex, מאפיינים לוגיים, טוקנים (לפי `web-design-css`).
- [ ] נגישות: אלמנטים סמנטיים, label, aria, focus.
- [ ] `npm run lint` נקי על הקובץ.

---

# רפרנס B – אבטחה, בדיקת קלט ומניעת הזרקות

## B.1 בדיקת קלט בכל פונקציה

**כלל:** כל פונקציה שמקבלת קלט ממקור שאינו קוד שלנו מוודאת אותו בתחילתה, לפני שימוש כלשהו.

מקורות שנחשבים לא-אמינים: טפסים ו-`FormData`, `params` / `searchParams`, cookies ו-headers, גוף בקשה ב-Route Handler, תשובות API חיצוני, `localStorage`, `JSON.parse`, קבצים שהועלו, ונתונים מהמסד שמשתמשים אחרים כתבו.

איך:
- סכמת zod ב-`src/lib/validation/`, משותפת ללקוח ולשרת.
- תמיד `safeParse` וטיפול מפורש בכישלון.
- לכל מחרוזת: `trim()` + `max()` (תמיד גבול עליון). מספרים: `int()`, `min`, `max`. ערכים קבועים: `z.enum([...])`. מזהים: `z.string().uuid()`.
- ברשימה לבנה (allowlist), לא רשימה שחורה.
- `z.object` מסנן שדות עודפים – לעולם לא להעביר את הקלט הגולמי ל-`insert`/`update`, רק את `parsed.data`.
- ולידציה בצד הלקוח היא לנוחות בלבד; **הולידציה המחייבת היא בשרת**.

דוגמה – פרמטרים מה-URL:
```ts
const paramsSchema = z.object({ id: z.string().uuid() });
const searchSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  sort: z.enum(["new", "old"]).default("new"),
});

export default async function Page({ params, searchParams }: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = paramsSchema.safeParse(await params);
  if (!p.success) notFound();
  const s = searchSchema.safeParse(await searchParams);
  const { page, sort } = s.success ? s.data : { page: 1, sort: "new" as const };
  // ...
}
```

דוגמה – `JSON.parse` / `localStorage`:
```ts
function readPrefs(): Prefs | null {
  try {
    const raw = localStorage.getItem("prefs");
    if (raw === null) return null;
    const parsed = prefsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
```

## B.2 Server Actions ו-Route Handlers

כל action/handler הוא endpoint ציבורי – גם אם רק הטופס שלנו קורא לו. סדר חובה בכל אחד:
1. ולידציה של הקלט (zod).
2. אימות: `supabase.auth.getUser()` (לא `getSession()` לצורך הרשאה).
3. הרשאה: האם המשתמש רשאי לפעולה על המשאב הזה (בנוסף ל-RLS).
4. ביצוע.
5. החזרת תוצאה מצומצמת – בלי שגיאות גולמיות, stack או פרטי מסד.

## B.3 מניעת SQL Injection

- רק query builder: `.eq("id", id)`, `.ilike("name", ...)`, `.in("status", list)`.
- אסור להעביר קלט משתמש ל-`.or()`, `.filter()` או `.order()` כמחרוזת חופשית – רק ערכים מתוך `z.enum`.
- חיפוש טקסט חופשי: פונקציית Postgres + `rpc("search_items", { q })` עם פרמטר.
- בפונקציות SQL: רק פרמטרים, לעולם לא `execute format(... || ...)` עם קלט. `security definer` רק עם `set search_path = ''`.

## B.4 מניעת XSS והרצת קוד זדוני

אסור מוחלט:
- `dangerouslySetInnerHTML`. אם אין ברירה (תוכן מ-CMS) – רק אחרי `DOMPurify.sanitize` בשרת עם allowlist של תגיות, ורק בקומפוננטה ייעודית `SafeHtml` עם הערה מסבירה.
- `eval`, `new Function`, `setTimeout`/`setInterval` עם מחרוזת.
- `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`.
- הטענת סקריפטים מכתובת שמקורה בקלט.
- פריסת props מקלט משתמש (`<div {...userObject} />`).
- ערכי עיצוב מקלט חופשי (גם לא דרך משתני CSS).

React מבצע escape לטקסט ב-`{}` – זו הדרך היחידה להציג תוכן משתמש.

## B.5 קישורים, הפניות וקבצים

`src/lib/security/safeHref.ts`:
```ts
import { z } from "zod";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const inputSchema = z.string().trim().min(1).max(2048);

/** מחזיר כתובת בטוחה או null. חוסם javascript:, data:, vbscript: וכו'. */
export function safeHref(input: unknown): string | null {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return null;
  const value = parsed.data;

  if (value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) {
    return value; // נתיב פנימי
  }
  try {
    const url = new URL(value);
    return ALLOWED_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

/** להפניות אחרי login – רק נתיבים פנימיים (מונע Open Redirect). */
export function safeRedirect(input: unknown, fallback = "/"): string {
  const href = safeHref(input);
  return href !== null && href.startsWith("/") ? href : fallback;
}
```

- כל `href`/`src` שמקורו בנתונים → `safeHref`; אם `null` – לא מציגים קישור.
- קישור חיצוני: `target="_blank" rel="noopener noreferrer"`.
- `next/image` מרוחק: רק דומיינים מפורשים ב-`remotePatterns`.
- העלאת קבצים: בדיקת סוג (allowlist של MIME), גודל מקסימלי, שם קובץ חדש מ-`crypto.randomUUID()` (לא השם המקורי), לא SVG ממשתמשים.

## B.6 ESLint – אכיפה אוטומטית

להוסיף ל-`eslint.config.mjs` אובייקט rules:
```js
{
  rules: {
    "prefer-template": "error",            // אוסר שרשור מחרוזות עם +
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "no-script-url": "error",
    "react/no-danger": "error",
    "react/jsx-no-target-blank": "error",
    "react/jsx-no-script-url": "error",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "no-restricted-properties": ["error",
      { "property": "innerHTML", "message": "אסור – השתמש ב-textContent או JSX" },
      { "property": "outerHTML", "message": "אסור" },
      { "property": "insertAdjacentHTML", "message": "אסור" },
      { "object": "document", "property": "write", "message": "אסור" }
    ]
  }
}
```
אסור להשתיק כללים אלה עם `eslint-disable`.

## B.7 כותרות אבטחה (next.config.ts)

```ts
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
export default nextConfig;
```
בנוסף – Content-Security-Policy עם nonce דרך middleware לפי התיעוד הרשמי של Next.js לגרסה המותקנת. לאתר סטטי – CSP בתגית `<meta http-equiv="Content-Security-Policy">`.

## B.8 סריקת קוד זדוני / דפוסים אסורים

להריץ לפני כל מסירה. כל תוצאה דורשת תיקון או הסבר מפורש למשתמש:
```bash
# הרצת קוד / הזרקת HTML
rg -n "dangerouslySetInnerHTML|\beval\(|new Function\(|\.innerHTML|\.outerHTML|insertAdjacentHTML|document\.write" src
# שרשור מחרוזות
rg -n "[\"'\`]\s*\+|\+\s*[\"'\`]" src --glob "*.{ts,tsx,js,jsx}"
# מפתחות סודיים שדלפו לקוד
rg -n "service_role|SERVICE_ROLE|sk_live|BEGIN PRIVATE KEY" src
rg -n "NEXT_PUBLIC_.*(SECRET|SERVICE|PRIVATE)" .
# סקריפטים מוסתרים / מקודדים
rg -n "atob\(|fromCharCode|\\\\x[0-9a-f]{2}|<script" src
# סקריפטים חשודים ב-package.json
rg -n "\"(pre|post)install\"" package.json
# שאריות Tailwind
rg -n "tailwind" package.json src
```
בנוסף: להתקין רק חבילות מוכרות עם שם מדויק (זהירות משמות דומים – typosquatting), לשמור `package-lock.json` ב-git, ולהריץ `npm audit`.