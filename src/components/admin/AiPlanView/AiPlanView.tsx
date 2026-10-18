import { formatPickupDate } from "@/lib/format";
import type { SavedPlan } from "@/lib/inventory/aiPlan";
import { formatAmount, type Batch } from "@/lib/inventory/calc";

import styles from "./AiPlanView.module.css";

type AiPlanViewProps = { plan: SavedPlan };

/** The AI plan by work day. Units and amounts come from the batches (our calculation), not from the AI. */
export function AiPlanView({ plan }: AiPlanViewProps) {
  const batches = new Map(plan.batches.map((b) => [b.id, b]));

  return (
    <div className={styles.plan}>
      {plan.warnings.length > 0 && (
        <div role="alert" className={styles.warnings}>
          <p className={styles.warningsTitle}>לבדוק לפני שמתחילים:</p>
          <ul role="list">
            {plan.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {plan.days.map((day) => (
        <section key={day.date} className={styles.day} aria-labelledby={`ai-${day.date}`}>
          <h3 id={`ai-${day.date}`} className={styles.dayTitle}>
            {formatPickupDate(day.date)}
          </h3>
          {groupTasks(day.tasks).map(([group, tasks]) => (
            <div key={group} className={styles.group}>
              <h4 className={styles.groupTitle}>{group}</h4>
              <ol className={styles.tasks}>
                {tasks.map((task, i) => (
                  <li key={`${day.date}-${group}-${i}`} className={styles.task}>
                    <p className={styles.taskHead}>
                      {task.time && <span className={styles.time}>{task.time}</span>}
                      <strong>{task.title}</strong>
                    </p>
                    {task.details && <p className={styles.details}>{task.details}</p>}
                    {task.batchIds.length > 0 && (
                      <ul role="list" className={styles.batches}>
                        {task.batchIds.flatMap((id) => {
                          const b = batches.get(id);
                          return b ? [<BatchItem key={id} batch={b} />] : [];
                        })}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </section>
      ))}

      {plan.notes.length > 0 && (
        <div className={styles.notes}>
          <p className={styles.notesTitle}>הערות</p>
          <ul role="list">
            {plan.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

type PlanTask = SavedPlan["days"][number]["tasks"][number];

/** A day's tasks by type of work (בצקים, קינוחים…), in the order the groups first appear. */
function groupTasks(tasks: PlanTask[]): [string, PlanTask[]][] {
  const groups = new Map<string, PlanTask[]>();
  for (const task of tasks) {
    const group = task.group.trim() || "כללי";
    groups.set(group, [...(groups.get(group) ?? []), task]);
  }
  return [...groups];
}

function BatchItem({ batch }: { batch: Batch }) {
  const summary = `${batch.productTitle} · ${batch.units} יח׳ · לאיסוף ${formatPickupDate(batch.pickupDate)}`;
  const hasDetail = batch.flavors.length > 0 || batch.ingredients.length > 0 || batch.manual.length > 0;
  if (!hasDetail) return <li className={styles.batch}>{summary}</li>;

  return (
    <li className={styles.batch}>
      <details>
        <summary>{summary}</summary>
        <div className={styles.batchDetail}>
          {batch.flavors.length > 0 && <p>טעמים: {batch.flavors.map((f) => `${f.label} ${f.units}`).join(" · ")}</p>}
          {batch.ingredients.length > 0 && <p>חומרים: {batch.ingredients.map((i) => `${i.name} ${formatAmount(i.amount, i.unit)}`).join(" · ")}</p>}
          {batch.manual.length > 0 && <p>ירקות: {batch.manual.join(", ")}</p>}
        </div>
      </details>
    </li>
  );
}

/** Plain-text version for WhatsApp. */
export function planToText(plan: SavedPlan, title: string): string {
  const batches = new Map(plan.batches.map((b) => [b.id, b]));
  return [
    title,
    ...plan.days.flatMap((day) => [
      "",
      `*${formatPickupDate(day.date)}*`,
      ...groupTasks(day.tasks).flatMap(([group, tasks]) => [
        `_${group}_`,
        ...tasks.map((t) => {
          const items = t.batchIds.flatMap((id) => {
            const b = batches.get(id);
            return b ? [`${b.productTitle} ${b.units}`] : [];
          });
          return `• ${t.time ? `${t.time} – ` : ""}${t.title}${items.length > 0 ? ` (${items.join(", ")})` : ""}`;
        }),
      ]),
    ]),
    ...(plan.notes.length > 0 ? ["", "הערות:", ...plan.notes.map((n) => `• ${n}`)] : []),
  ].join("\n");
}
