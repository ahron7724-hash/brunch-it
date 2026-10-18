---
name: "web-design-css"
description: "Visual design and styling for websites with plain CSS (CSS Modules in Next.js), flex-first layout, Hebrew/RTL, design tokens, modest imagery. Use for any page, component or styling work."
---

# עיצוב אתרים – CSS נקי, Flex קודם

סקיל העיצוב לכל עמוד, קומפוננטה ועיצוב באתר. עובד יחד עם הסקיל `website-builder`.

**קדימות:** בכל נושא עיצובי – סקיל זה גובר. במיוחד: **לא משתמשים ב-Tailwind**, גם אם סקיל אחר מזכיר אותו. ביצירת פרויקט Next מורידים את `--tailwind` מהפקודה, ובמקום `cn()` משתמשים ב-`clsx` בלבד (בלי `tailwind-merge`).

---

## 1. עקרונות יסוד

1. **CSS נקי.** ב-Next.js: CSS Modules (`Component.module.css` לצד כל קומפוננטה) + קבצים גלובליים. באתר סטטי: `assets/css/`.
   אסור: Tailwind, CSS-in-JS (styled-components וכו'), Bootstrap, `style={{...}}` inline. חריג יחיד: העברת ערך דינמי כמשתנה CSS – `style={{ "--progress": `${value}%` } as React.CSSProperties}`.
2. **Flex קודם.** כל פריסה מתחילה ב-`display: flex`. Grid רק כש-flex באמת לא מספיק (סעיף 4.4), עם הערה בקוד שמסבירה למה.
3. **טוקנים בלבד.** כל צבע, רווח, גודל גופן, רדיוס וצל – ממשתנה ב-`tokens.css`. אין מספרי קסם ואין hex מפוזר בקבצים.
4. **RTL מהיסוד** – מאפיינים לוגיים בלבד.
5. **Mobile-first** – העיצוב הבסיסי לנייד, ו-`@media (min-width: ...)` מרחיב.
6. **צניעות וכבוד** בתמונות ובתוכן.

## 2. סדר עבודה

1. **תדריך עיצובי קצר** – אופי האתר (יוקרתי / חם / מקצועי / רגוע), קהל, צבעי מותג קיימים. אם אין – הצע 2 כיוונים מסעיף 7 וקבל בחירה.
2. **קובץ החלטות `design-system.md`** בשורש הפרויקט: פלטה, גופנים, סקאלות, סגנון כפתורים וכרטיסים. אם הקובץ קיים – **קרא אותו קודם ועבוד לפיו**; כל החלטה חדשה נרשמת בו. כך העיצוב נשאר אחיד בין שיחות.
3. **קבצי בסיס** – `reset.css`, `tokens.css`, `globals.css` (סעיף 3).
4. **שלד פריסה** – header / main / footer עם flex (סעיף 4).
5. **קומפוננטות** – כל אחת עם קובץ CSS Module משלה.
6. **בדיקה** – רשימה בסעיף 11.

## 3. מבנה קבצי CSS

```
src/styles/
  reset.css      איפוס מינימלי
  tokens.css     משתני עיצוב (מקור אמת יחיד)
  globals.css    מייבא את שניהם + עיצוב תגיות בסיסיות + מחלקות פריסה משותפות
src/components/Button/
  Button.tsx
  Button.module.css
```
ב-`app/layout.tsx`: `import "@/styles/globals.css";`

### tokens.css (תבנית – להתאים ערכים לפי הפלטה)
```css
:root {
  /* צבעים – תפקידיים, לא לפי שם הצבע */
  --color-bg: #fbfaf7;
  --color-surface: #ffffff;
  --color-text: #1d2433;
  --color-text-muted: #5b6475;
  --color-border: #e3e1db;
  --color-primary: #1f4e79;
  --color-primary-hover: #183e60;
  --color-on-primary: #ffffff;
  --color-accent: #b8893b;
  --color-success: #2e7d4f;
  --color-error: #b3261e;
  --color-focus: #2563eb;

  /* רווחים – סקאלה של 4px */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-24: 6rem;

  /* טיפוגרפיה */
  --font-body: "Heebo", "Assistant", system-ui, sans-serif;
  --font-heading: var(--font-body);
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.25rem + 1vw, 2rem);
  --text-3xl: clamp(1.875rem, 1.4rem + 2vw, 2.75rem);
  --text-4xl: clamp(2.25rem, 1.6rem + 3vw, 3.5rem);
  --leading-body: 1.7;
  --leading-tight: 1.25;

  /* צורה */
  --radius-sm: 0.375rem;
  --radius-md: 0.75rem;
  --radius-lg: 1.25rem;
  --radius-full: 999px;
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.06);
  --shadow-md: 0 4px 16px rgb(0 0 0 / 0.08);

  /* פריסה */
  --container-max: 72rem;
  --container-pad: var(--space-4);
  --header-height: 4rem;

  /* תנועה */
  --ease: cubic-bezier(0.2, 0, 0, 1);
  --duration: 180ms;

  /* שכבות */
  --z-header: 100;
  --z-overlay: 200;
  --z-modal: 300;
}
```

### reset.css
```css
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }
html { -webkit-text-size-adjust: 100%; }
body { min-height: 100dvh; }
img, picture, svg, video { display: block; max-width: 100%; height: auto; }
input, button, textarea, select { font: inherit; color: inherit; }
button { cursor: pointer; }
p, h1, h2, h3, h4 { overflow-wrap: break-word; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
(זה המקום היחיד בפרויקט שבו מותר `!important`.)

### globals.css – בסיס
```css
@import "./reset.css";
@import "./tokens.css";

body {
  display: flex;
  flex-direction: column;
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-body);
  color: var(--color-text);
  background: var(--color-bg);
}
main { flex: 1; }

h1, h2, h3 { font-family: var(--font-heading); line-height: var(--leading-tight); }
h1 { font-size: var(--text-4xl); }
h2 { font-size: var(--text-3xl); }
h3 { font-size: var(--text-xl); }
p { max-inline-size: 65ch; }

a { color: var(--color-primary); text-underline-offset: 0.2em; }

:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.skip-link {
  position: absolute;
  inset-inline-start: var(--space-4);
  inset-block-start: -10rem;
}
.skip-link:focus { inset-block-start: var(--space-4); }

.visually-hidden {
  position: absolute; width: 1px; height: 1px;
  overflow: hidden; clip-path: inset(50%); white-space: nowrap;
}
```
גופנים ב-Next: `next/font/google` עם `subsets: ["hebrew", "latin"]` ו-`variable: "--font-heebo"`, ואז ב-tokens: `--font-body: var(--font-heebo), system-ui, sans-serif;`.

## 4. פריסה – Flex קודם

### 4.1 כללי חובה
- רווח בין אחים – תמיד `gap`, לא margin על הילדים.
- ילד flex שמכיל טקסט ארוך – `min-inline-size: 0` (מונע גלישה).
- הגדרת גודל ילד ב-`flex: <grow> <shrink> <basis>`, לא ב-`width` קשיח.
- **לעולם לא `row-reverse` כדי לתקן RTL** – ב-`dir="rtl"` השורה כבר מתחילה מימין. `justify-content: flex-start` = ימין בעברית.
- שינוי סדר חזותי ב-`order` רק אם סדר הקריאה של קורא מסך נשאר הגיוני.

### 4.2 מחלקות פריסה משותפות (ב-globals.css)
```css
.container {
  inline-size: min(100% - 2 * var(--container-pad), var(--container-max));
  margin-inline: auto;
}

/* ערימה אנכית */
.stack { display: flex; flex-direction: column; gap: var(--stack-gap, var(--space-4)); }

/* שורה עם גלישה */
.cluster {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--cluster-gap, var(--space-3));
}

/* שני קצוות (לוגו מימין, תפריט משמאל) */
.split { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); }

/* מרכוז */
.center { display: flex; align-items: center; justify-content: center; }

/* כרטיסים רספונסיביים בלי media query */
.card-row { display: flex; flex-wrap: wrap; gap: var(--space-6); }
.card-row > * { flex: 1 1 18rem; min-inline-size: 0; }

/* תוכן + סרגל צד – נעטף לעמודה אוטומטית במסך צר */
.with-sidebar { display: flex; flex-wrap: wrap; gap: var(--space-8); }
.with-sidebar > :first-child { flex: 1 1 16rem; }
.with-sidebar > :last-child { flex: 999 1 30rem; min-inline-size: 0; }
```
בקומפוננטות משתמשים במחלקות האלה יחד עם מחלקת ה-module: `className={clsx("stack", styles.card)}`.

### 4.3 תבניות נפוצות
- **Header:** `.split` + `position: sticky; inset-block-start: 0; z-index: var(--z-header);`
- **תפריט ניווט:** `ul` עם `.cluster`; בנייד – כפתור המבורגר עם `aria-expanded` ו-`aria-controls`, התפריט נפתח כ-`flex-direction: column`.
- **Hero:** `.stack` ממורכז או שתי עמודות ב-`.with-sidebar`; כותרת, משפט הסבר, קריאה לפעולה אחת בולטת.
- **Footer דבוק לתחתית:** כבר קיים – `body` הוא flex column ו-`main { flex: 1 }`.
- **כרטיס:** `.stack` עם כפתור בתחתית – `margin-block-start: auto` על הכפתור מיישר אותו לתחתית בכל הכרטיסים.
- **שדות טופס בשורה:** `.cluster` עם `flex: 1 1 14rem` לכל שדה.

### 4.4 מתי מותר Grid
רק כשצריך יישור **דו-ממדי אמיתי** – שורות ועמודות שחייבות להיות מיושרות יחד (לוח שנה, טבלת מחירים עם שורות מיושרות, גלריה שבה כל התאים באותו רוחב בדיוק גם בשורה האחרונה), או פריסה עם אזורים חופפים. חובה לצרף הערה:
```css
/* grid: נדרש יישור עמודות בין שורות – flex-wrap לא שומר על זה */
```

## 5. RTL ועברית

- `<html lang="he" dir="rtl">`.
- מאפיינים לוגיים בלבד:

| אסור | חובה |
|---|---|
| `margin-left/right` | `margin-inline-start/end` |
| `padding-left/right` | `padding-inline-start/end` |
| `left` / `right` | `inset-inline-start/end` |
| `top` / `bottom` | `inset-block-start/end` |
| `width` / `height` | `inline-size` / `block-size` (מומלץ) |
| `text-align: left/right` | `text-align: start/end` |
| `border-left` | `border-inline-start` |
| `border-top-left-radius` | `border-start-start-radius` |

- אייקונים כיווניים (חץ, "הבא", חזרה): `.icon-dir:dir(rtl) { transform: scaleX(-1); }`. אייקונים לא-כיווניים (בית, חיפוש) – לא הופכים.
- טלפון, אימייל, קוד, URL – עטופים ב-`dir="ltr"` ועם `unicode-bidi: isolate`.
- גופנים מומלצים: גוף – Heebo, Assistant, Rubik, Noto Sans Hebrew; כותרות מכובדות – Frank Ruhl Libre, David Libre, Noto Serif Hebrew. מקסימום 2 משפחות.
- עברית קריאה יותר עם `line-height` 1.6–1.8 וגודל גוף של 16–18px לפחות. לא משתמשים ב-`letter-spacing` חיובי על עברית ולא ב-`text-transform: uppercase`.

## 6. רספונסיביות

- נקודות שבירה (min-width): `40em` (640), `48em` (768), `64em` (1024), `80em` (1280).
- קודם פריסות שמתאימות את עצמן בלי media query (`flex-wrap` + `flex-basis`, `clamp()`), ורק אחר כך media queries.
- קומפוננטה שתלויה ברוחב המכיל שלה – `container-type: inline-size` + `@container`.
- יעד מגע: מינימום `2.75rem` (44px) לכפתורים וקישורי תפריט.
- אסורה גלילה אופקית בשום רוחב.

## 7. צבעים

- כלל 60-30-10: רקע ניטרלי 60%, צבע ראשי 30%, הדגשה 10%.
- ניגודיות: טקסט רגיל 4.5:1, טקסט גדול ורכיבי ממשק 3:1. לבדוק כל צמד טקסט/רקע.
- לא להסתמך על צבע בלבד להעברת מידע (שגיאה = צבע + אייקון + טקסט).

פלטות פתיחה (רקע / טקסט / ראשי / הדגשה):
- **מכובד קלאסי:** `#fbfaf7` / `#1d2433` / `#1f4e79` / `#b8893b`
- **חם ומזמין:** `#fdf8f3` / `#2b2420` / `#9a4a2f` / `#d9a441`
- **רגוע וטבעי:** `#f6f8f5` / `#1f2a24` / `#2f6b4f` / `#c9a66b`
- **מקצועי מודרני:** `#f7f8fa` / `#111827` / `#2546a8` / `#0e9f8e`

מצב כהה – רק אם נדרש, דרך הגדרה מחדש של הטוקנים ב-`@media (prefers-color-scheme: dark)`.

## 8. קומפוננטות בסיס – מצבים חובה

כל אלמנט אינטראקטיבי מקבל: רגיל, `:hover`, `:focus-visible`, `:active`, `:disabled` / `[aria-disabled="true"]`, ומצב טעינה אם רלוונטי.

דוגמה – `Button.module.css`:
```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-block-size: 2.75rem;
  padding-inline: var(--space-6);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-weight: 600;
  text-decoration: none;
  transition: background-color var(--duration) var(--ease),
              border-color var(--duration) var(--ease);
}

.primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
.primary:hover { background: var(--color-primary-hover); }

.secondary {
  background: transparent;
  border-color: var(--color-border);
  color: var(--color-text);
}
.secondary:hover { border-color: var(--color-primary); }

.button:disabled,
.button[aria-disabled="true"] {
  opacity: 0.55;
  cursor: not-allowed;
}
```

טפסים: label גלוי מעל כל שדה (לא placeholder במקום label), מסגרת שמשנה צבע ב-focus ובשגיאה, הודעת שגיאה מתחת לשדה.

## 9. תמונות, אייקונים ותוכן

- תמונות צנועות ומכובדות בלבד. ברירת מחדל ל-placeholder: נוף, אדריכלות, חפצים, מרקמים, איורים גיאומטריים – לא דמויות. אם נדרשת תמונת אדם – משאירים מקום עם הערה שהמשתמש יבחר בעצמו.
- יחס קבוע מראש: `aspect-ratio` + `object-fit: cover` (מונע קפיצות תוכן).
- אייקונים: ספרייה אחת בלבד לכל האתר (מומלץ `lucide-react`), באותו עובי קו. לא אימוג'ים כאייקונים.
- ניסוחים מכובדים, קצרים וברורים. פנייה בלשון רבים כברירת מחדל ("צרו קשר").

## 10. מה מבדיל עיצוב מקצועי מעיצוב "גנרי"

- היררכיה ברורה: נקודת מוקד אחת בכל אזור, קפיצות גודל משמעותיות בין רמות כותרת.
- ריווח נדיב ועקבי – רק מהסקאלה; בין סקשנים `--space-16` עד `--space-24`.
- להימנע: גרדיאנט סגול-כחול כברירת מחדל, צללים כבדים על הכל, יותר מ-3 צבעים בולטים, כרטיסים זהים בכל מקום, טקסט ממורכז בפסקאות ארוכות, אנימציות על כל גלילה.
- פרט אחד מזהה לכל אתר (צורה חוזרת, קו הדגשה, סגנון כותרות) – נרשם ב-`design-system.md`.
- אנימציות עדינות בלבד (150–250ms), על `transform` ו-`opacity` בלבד.

## 11. סגנון כתיבת CSS

- סדר מאפיינים בכל כלל: פריסה (display, flex, gap, position) → מידות (size, padding, margin) → טיפוגרפיה → מראה (background, border, shadow) → תנועה.
- שמות מחלקות ב-CSS Modules ב-camelCase (`styles.cardTitle`); מחלקות גלובליות ב-kebab-case.
- אסור: `!important` (מלבד reset), עיצוב לפי `#id`, קינון מעל 2 רמות, ערכי hex/px מחוץ ל-tokens, `float` לפריסה.
- יחידות: `rem` לגדלים ורווחים, `em` ב-media queries, `px` רק לעובי מסגרת, `dvh` במקום `vh`.
- קינון CSS מקורי (`&:hover`) מותר, עד 2 רמות.

## 12. רשימת בדיקה עיצובית (לפני מסירה)

- [ ] אין מחלקות Tailwind, אין `style={{}}` (מלבד משתני CSS), אין CSS-in-JS.
- [ ] כל פריסה ב-flex; כל `display: grid` מלווה בהערת הצדקה.
- [ ] רווחים בין אחים ב-`gap`.
- [ ] אין `left/right`, `margin-left/right`, `padding-left/right`, `text-align: left/right`.
- [ ] אין hex או px מחוץ ל-`tokens.css` (מלבד עובי מסגרת).
- [ ] נבדק ב-375 / 768 / 1280px – בלי גלילה אופקית, בלי טקסט חתוך.
- [ ] ניגודיות תקינה לכל צמד טקסט/רקע.
- [ ] focus נראה על כל אלמנט אינטראקטיבי; יעדי מגע 44px.
- [ ] `prefers-reduced-motion` מכובד.
- [ ] תמונות צנועות, עם `alt` ו-`aspect-ratio`.
- [ ] `design-system.md` מעודכן.

סריקה מהירה:
```bash
rg -n "className=\"[^\"]*\b(flex|grid|p-|m-|text-|bg-|w-|h-)[0-9a-z-]*" src   # שאריות Tailwind
rg -n "style=\{\{" src                                                        # inline styles
rg -n "(margin|padding)-(left|right)|(^|[^-])\b(left|right):|text-align:\s*(left|right)" src --glob "*.css"
rg -n "display:\s*grid" src --glob "*.css"                                  # לוודא שיש הערת הצדקה
rg -n "#[0-9a-fA-F]{3,8}\b" src --glob "*.css" --glob "!**/tokens.css"       # צבעים מחוץ לטוקנים
```