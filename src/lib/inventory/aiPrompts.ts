import "server-only";

import { formatPickupDate } from "@/lib/format";

import { formatAmount, type Batch, type PrepStep } from "./calc";

const PLANNER_SYSTEM = `את/ה מתכנן/ת ייצור במטבח של עסק קייטרינג ביתי כשר בישראל.
המטרה: תוכנית עבודה מעשית לפי ימים, כך שכל ההזמנות יהיו מוכנות בזמן, טריות, ובלי עומס מיותר ביום האיסוף.

כללים מחייבים:
- פועלים לפי "כללי המטבח" של העסק. הם גוברים על כל הנחה אחרת.
- אין עבודה בשבת ובחגים. מה שהיה אמור לקרות בהם – מקדימים.
- חושבים לפי סוגי עבודה במטבח, לא לפי מוצר: כל משימה שייכת לקבוצה (group) – למשל בצקים ותחתיות, מילויים, קינוחים ומתוקים, סלטים וירקות, אפייה, הרכבה ואריזה.
- בכל יום מרכזים את כל המנות שצריכות את אותו סוג עבודה למשימה אחת (למשל "בצקים" לכל הקישים והפשטידות יחד), כדי לעבוד ברצף בתחנה אחת.
- מוצר אחד יכול להופיע בכמה קבוצות ובכמה ימים (בצק יומיים לפני, מילוי יום לפני, הרכבה ביום האיסוף).
- כל מנה (B1, B2…) חייבת להופיע לפחות במשימה אחת.
- שום משימה לא אחרי תאריך האיסוף של המנות שלה.
- לא לכתוב מספרים, כמויות או יחידות בשם המשימה או בהסבר – המערכת מוסיפה אותם לבד מתוך המנות.
- לאחד עבודה דומה: אותו בצק / מלית / קרם לכמה מנות – משימה אחת.
- סדר המשימות בכל יום – לפי סדר הביצוע.
- עברית פשוטה וקצרה.`;


function batchLines(batches: Batch[]): string {
  return batches
    .map((b) => {
      const flavors = b.flavors.length > 0 ? ` | טעמים: ${b.flavors.map((f) => `${f.label} ${f.units}`).join(", ")}` : "";
      const ingredients = b.ingredients.length > 0 ? ` | חומרים: ${b.ingredients.map((i) => `${i.name} ${formatAmount(i.amount, i.unit)}`).join(", ")}` : "";
      const manual = b.manual.length > 0 ? ` | ירקות: ${b.manual.join(", ")}` : "";
      const kind = b.categories.length > 0 ? ` [${b.categories.join(", ")}]` : "";
      return `${b.id}: ${b.productTitle}${kind} – ${b.units} יח׳, איסוף ${b.pickupDate} (${formatPickupDate(b.pickupDate)})${flavors}${ingredients}${manual}`;
    })
    .join("\n");
}

export function plannerPrompt(input: {
  today: string;
  rules: string;
  batches: Batch[];
  steps: PrepStep[];
  holidays: Map<string, string>;
  shortages: string[];
  instructions: string;
}): { system: string; prompt: string } {
  const stepsByProduct = new Map<string, PrepStep[]>();
  for (const s of input.steps) stepsByProduct.set(s.productId, [...(stepsByProduct.get(s.productId) ?? []), s]);
  const knownSteps = input.batches
    .flatMap((b) => {
      const steps = b.productId ? stepsByProduct.get(b.productId) : undefined;
      return steps ? [`${b.productTitle}: ${steps.map((s) => `${s.title} (${s.daysBefore} ימים לפני)`).join(" → ")}`] : [];
    })
    .filter((line, i, all) => all.indexOf(line) === i);

  const prompt = [
    `היום: ${input.today} (${formatPickupDate(input.today)}). לא לתכנן משימות לפני היום.`,
    "",
    "כללי המטבח:",
    input.rules || "(לא הוגדרו – להשתמש בשיקול דעת מקצועי)",
    "",
    "מנות לתכנון:",
    batchLines(input.batches),
    knownSteps.length > 0 ? `\nשלבי הכנה שהוגדרו למוצרים (להיעזר בהם):\n${knownSteps.join("\n")}` : "",
    input.holidays.size > 0 ? `\nחגים (אין עבודה): ${[...input.holidays].map(([d, n]) => `${d} ${n}`).join(", ")}` : "",
    input.shortages.length > 0 ? `\nחסר במלאי (לקנות לפני ההכנה): ${input.shortages.join(", ")}` : "",
    input.instructions ? `\nהערות מהמנהלת לתכנון הזה (חשוב):\n${input.instructions}` : "",
  ].join("\n");

  return { system: PLANNER_SYSTEM, prompt };
}
