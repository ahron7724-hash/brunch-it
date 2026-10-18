import Link from "next/link";

import { AdminHeader } from "@/components/admin/AdminHeader/AdminHeader";
import { AiPlanGenerator } from "@/components/admin/AiPlanGenerator/AiPlanGenerator";
import { AiPlanView, planToText } from "@/components/admin/AiPlanView/AiPlanView";
import { KitchenRulesForm } from "@/components/admin/KitchenRulesForm/KitchenRulesForm";
import { Panel } from "@/components/admin/Panel/Panel";
import { PrepTaskCheck } from "@/components/admin/PrepTaskCheck/PrepTaskCheck";
import { PrintShare } from "@/components/admin/PrintShare/PrintShare";
import { RangeFilter } from "@/components/admin/RangeFilter/RangeFilter";
import { UsageForm } from "@/components/admin/UsageForm/UsageForm";
import { formatPickupDate } from "@/lib/format";
import { manualNeeds, productionSummary, workPlan } from "@/lib/inventory/calc";
import { getKitchenRules, getLatestPlan, listActiveOrderLines, listDoneSteps, listMaterials, listPrepSteps, listRecipes } from "@/lib/inventory/data";
import { parseRange } from "@/lib/inventory/range";

import styles from "./production.module.css";

type ProductionPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function stageLabel(daysBefore: number): string {
  if (daysBefore === 0) return "יום האיסוף";
  if (daysBefore === 1) return "יום קודם";
  return `הכנה מראש · ${daysBefore} ימים לפני`;
}

export default async function ProductionPage({ searchParams }: ProductionPageProps) {
  const { from, to } = parseRange(await searchParams, 6);
  const [lines, steps, recipes, materials, done, rules, aiPlan] = await Promise.all([
    listActiveOrderLines(from, to),
    listPrepSteps(),
    listRecipes(),
    listMaterials(),
    listDoneSteps(from, to),
    getKitchenRules(),
    getLatestPlan(from, to),
  ]);
  const summary = productionSummary(lines);
  const plan = workPlan(lines, steps);
  const vegetables = manualNeeds(lines, recipes, materials);
  const vegetableRows = materials.flatMap((material) => {
    const uses = vegetables.get(material.id);
    return uses ? [{ material, uses }] : [];
  });
  const withSteps = new Set(steps.map((s) => s.productId));
  const missingSteps = [...new Map(lines.filter((l) => l.productId && !withSteps.has(l.productId)).map((l) => [l.productId, l.productTitle])).entries()];
  const range = `${formatPickupDate(from)} – ${formatPickupDate(to)}`;

  const summaryText = [
    `תוכנית עבודה · ${range}`,
    ...summary.flatMap((day) => [
      "",
      `לאיסוף ${formatPickupDate(day.pickupDate)} – סה״כ ${day.totalUnits} יח׳:`,
      ...day.products.map((p) => `• ${p.title}: ${p.units}${p.flavors.length > 0 ? ` (${p.flavors.map((f) => `${f.label} ${f.units}`).join(", ")})` : ""}`),
    ]),
  ].join("\n");
  const text = aiPlan ? planToText(aiPlan.plan, `תוכנית עבודה · ${range}`) : summaryText;
  const planTime = aiPlan
    ? new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Jerusalem" }).format(new Date(aiPlan.createdAt))
    : null;

  return (
    <>
      <AdminHeader title="תוכנית עבודה" description={`הזמנות פעילות לאיסוף ${range}`}>
        <PrintShare text={text} />
      </AdminHeader>

      <RangeFilter from={from} to={to} />

      {lines.length === 0 && <p className={styles.empty}>אין הזמנות פעילות לאיסוף בטווח הזה.</p>}

      {lines.length > 0 && (
        <Panel
          title="תוכנית עבודה עם AI"
          description={
            planTime
              ? `נוצרה ${planTime}. הכמויות מחושבות במערכת; ה-AI רק מסדר מה עושים ומתי. אם הזמנות השתנו – לתכנן מחדש.`
              : "ה-AI מחלק את כל ההכנות לימים לפי כללי המטבח (בתחתית העמוד). הכמויות מחושבות במערכת, לא על ידי ה-AI."
          }
        >
          <AiPlanGenerator from={from} to={to} hasPlan={aiPlan !== null} />
          {aiPlan && <AiPlanView plan={aiPlan.plan} />}
        </Panel>
      )}

      {summary.length > 0 && (
        <Panel title="סיכום להכנה" description="כל היחידות לפי תאריך איסוף (מארזים × יחידות במארז).">
          <div className={styles.days}>
            {summary.map((day) => (
              <section key={day.pickupDate} className={styles.day} aria-labelledby={`sum-${day.pickupDate}`}>
                <h3 id={`sum-${day.pickupDate}`} className={styles.dayTitle}>
                  לאיסוף {formatPickupDate(day.pickupDate)}
                  <span className={styles.total}>סה״כ {day.totalUnits} יח׳</span>
                </h3>
                <ul role="list" className={styles.products}>
                  {day.products.map((p) => (
                    <li key={p.title} className={styles.product}>
                      <span className={styles.productLine}>
                        <span>{p.title}</span>
                        <strong className={styles.num}>{p.units}</strong>
                      </span>
                      {p.flavors.length > 0 && (
                        <span className={styles.flavors}>{p.flavors.map((f) => `${f.label}: ${f.units}`).join(" · ")}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Panel>
      )}

      {plan.length > 0 && (
        <Panel title="משימות לפי שלבי ההכנה" description="מחושב ישירות משלבי ההכנה של כל מוצר (בלי AI). שלב שנופל בשבת עובר ליום שישי. מסמנים מה בוצע.">
          <div className={styles.days}>
            {plan.map((day) => (
              <section key={day.workDate} className={styles.day} aria-labelledby={`work-${day.workDate}`}>
                <h3 id={`work-${day.workDate}`} className={styles.dayTitle}>
                  {formatPickupDate(day.workDate)}
                </h3>
                <ul role="list">
                  {day.tasks.map((t) => (
                    <li key={`${t.stepId}|${t.pickupDate}`}>
                      <PrepTaskCheck stepId={t.stepId} pickupDate={t.pickupDate} done={done.has(`${t.stepId}|${t.pickupDate}`)}>
                        <span>
                          <strong>{t.title}</strong> – {t.productTitle} · <span className={styles.num}>{t.units} יח׳</span>
                        </span>
                        <span className={styles.meta}>
                          {stageLabel(t.daysBefore)} · לאיסוף {formatPickupDate(t.pickupDate)}
                        </span>
                      </PrepTaskCheck>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Panel>
      )}

      {missingSteps.length > 0 && (
        <p className={styles.notice}>
          אין שלבי הכנה ל:{" "}
          {missingSteps.map(([id, title], i) => (
            <span key={id}>
              {i > 0 && ", "}
              <Link href={`/admin/products/${id}/recipe`}>{title}</Link>
            </span>
          ))}
          . מגדירים אותם בעמוד המתכון של המוצר.
        </p>
      )}

      {vegetableRows.length > 0 && (
        <Panel title="ירקות לכל ההזמנות" description="כל ירק, ולמה בדיוק הוא נדרש. אחרי ההכנה מזינים כמה ירד בפועל, והמלאי מתעדכן.">
          <UsageForm rows={vegetableRows} note={`תוכנית עבודה ${range}`} />
        </Panel>
      )}

      <Panel title="כללי המטבח" description="ה-AI פועל לפי הכללים האלה כשהוא מתכנן את ימי העבודה. כותבים חופשי, שורה לכל כלל.">
        <KitchenRulesForm rules={rules} />
      </Panel>
    </>
  );
}
