import { z } from "zod";

import { UNITS, type Batch } from "./calc.ts";

// Shapes of the AI production plan. The AI only refers to batches by id ("B3");
// units and ingredient amounts always come from our own calculation.

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** What Gemini must return for a production plan. */
export const aiPlanSchema = z.object({
  days: z
    .array(
      z.object({
        date: isoDate.describe("תאריך העבודה, YYYY-MM-DD"),
        tasks: z
          .array(
            z.object({
              group: z.string().min(1).max(60).describe("סוג ההכנה / תחנת העבודה, למשל: בצקים, מילויים, קינוחים, סלטים, הרכבה ואריזה"),
              time: z.string().max(60).describe("מתי ביום, למשל: בוקר / צהריים / לפני האיסוף"),
              title: z.string().min(1).max(160).describe("שם המשימה, בלי מספרים וכמויות"),
              details: z.string().max(800).describe("הסבר קצר איך ולמה, בלי מספרים וכמויות"),
              batchIds: z.array(z.string().max(10)).max(40).describe("מזהי המנות שהמשימה מכסה, למשל B1"),
            })
          )
          .max(40),
      })
    )
    .max(31),
  notes: z.array(z.string().max(500)).max(10).describe("הערות כלליות: מה לקנות קודם, מה להקפיא, סיכונים"),
});

export type AiPlan = z.infer<typeof aiPlanSchema>;

const batchSchema = z.object({
  id: z.string(),
  pickupDate: z.string(),
  productId: z.string().nullable(),
  productTitle: z.string(),
  categories: z.array(z.string()).catch([]),
  units: z.number(),
  flavors: z.array(z.object({ label: z.string(), units: z.number() })),
  ingredients: z.array(z.object({ name: z.string(), amount: z.number(), unit: z.enum(UNITS) })),
  manual: z.array(z.string()),
});

/** A plan as stored: the AI's arrangement + the batches it refers to + our checks. */
export const savedPlanSchema = aiPlanSchema.extend({
  batches: z.array(batchSchema),
  warnings: z.array(z.string()),
  instructions: z.string().optional(),
});

export type SavedPlan = z.infer<typeof savedPlanSchema>;

/**
 * Checks the AI's plan against the batches: unknown ids are dropped, and anything
 * that wasn't planned, falls on Shabbat or comes after its pickup date becomes a warning.
 */
export function checkPlan(plan: AiPlan, batches: Batch[]): { plan: AiPlan; warnings: string[] } {
  const byId = new Map(batches.map((b) => [b.id, b]));
  const warnings: string[] = [];
  const used = new Set<string>();

  const days = plan.days
    .map((day) => ({
      date: day.date,
      tasks: day.tasks.map((task) => {
        const ids = [...new Set(task.batchIds)].filter((id) => byId.has(id));
        for (const id of ids) {
          used.add(id);
          const batch = byId.get(id)!;
          if (day.date > batch.pickupDate) warnings.push(`"${task.title}" מתוכנן אחרי מועד האיסוף של ${batch.productTitle}`);
        }
        return { ...task, batchIds: ids };
      }),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  for (const day of days) {
    if (new Date(`${day.date}T00:00:00Z`).getUTCDay() === 6 && day.tasks.length > 0) warnings.push(`יש משימות בשבת (${day.date})`);
  }
  for (const batch of batches) {
    if (!used.has(batch.id)) warnings.push(`לא תוכננה הכנה ל${batch.productTitle} (${batch.units} יח׳, איסוף ${batch.pickupDate})`);
  }
  return { plan: { days, notes: plan.notes }, warnings };
}
