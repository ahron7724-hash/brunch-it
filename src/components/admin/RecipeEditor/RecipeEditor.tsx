"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { saveRecipe } from "@/app/admin/(panel)/products/[id]/recipe/actions";
import { Panel } from "@/components/admin/Panel/Panel";
import { fromEditableRows, RowsField, toEditableRows, type Column, type EditableRow } from "@/components/admin/RowsField/RowsField";
import { Button } from "@/components/ui/Button/Button";
import { formatAmount, UNIT_LABELS, wholeUnits, type Material } from "@/lib/inventory/calc";

import styles from "./RecipeEditor.module.css";

const BASE = "base";

const DAYS_CHOICES = [
  { value: "0", label: "ביום האיסוף" },
  { value: "1", label: "יום לפני" },
  { value: "2", label: "יומיים לפני" },
  { value: "3", label: "3 ימים לפני" },
  { value: "4", label: "4 ימים לפני" },
  { value: "5", label: "5 ימים לפני" },
  { value: "6", label: "6 ימים לפני" },
  { value: "7", label: "שבוע לפני" },
];

const STEP_COLUMNS: Column[] = [
  { key: "title", label: "שלב", placeholder: "למשל: הכנת בצק ותחתיות", maxLength: 120, grow: 3 },
  { key: "daysBefore", label: "מתי", type: "select", choices: DAYS_CHOICES, grow: 1 },
];

type RecipeEditorProps = {
  productId: string;
  materials: Material[];
  options: { id: string; label: string }[];
  sizes: { label: string; unitCount: number }[];
  /** Saved recipe rows by section ("base" or option id). */
  sections: Record<string, Record<string, string>[]>;
  steps: Record<string, string>[];
  /** The admin's own free-text notes; never shown to customers. */
  notes: string;
};

/** The recipe page: base ingredients, extra ingredients per flavor, and prep steps, with one save button. */
export function RecipeEditor({ productId, materials, options, sizes, sections: savedSections, steps: savedSteps, notes: savedNotes }: RecipeEditorProps) {
  const byId = new Map(materials.map((m) => [m.id, m]));
  const [sections, setSections] = useState(() => toSections(savedSections));
  const [steps, setSteps] = useState(() => toEditableRows(savedSteps));
  const [notes, setNotes] = useState(savedNotes);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [batch, setBatch] = useState(String(sizes[0]?.unitCount ?? 1));

  // After a save the server sends fresh rows (new steps get ids); take them in.
  const [synced, setSynced] = useState({ savedSections, savedSteps, savedNotes });
  if (synced.savedSections !== savedSections || synced.savedSteps !== savedSteps || synced.savedNotes !== savedNotes) {
    setSynced({ savedSections, savedSteps, savedNotes });
    setSections(toSections(savedSections));
    setSteps(toEditableRows(savedSteps));
    setNotes(savedNotes);
  }

  if (materials.length === 0) {
    return (
      <Panel title="מתכון">
        <p className={styles.muted}>
          קודם מוסיפים חומרי גלם בעמוד <Link href="/admin/inventory">מלאי</Link>, ואז בונים כאן את המתכון.
        </p>
      </Panel>
    );
  }

  const isManual = (materialId: string | undefined) => byId.get(materialId ?? "")?.tracking === "manual";

  const columns: Column[] = [
    {
      key: "materialId",
      label: "חומר גלם",
      type: "select",
      placeholder: "בחירה…",
      choices: materials.map((m) => ({ value: m.id, label: m.tracking === "manual" ? `${m.name} (ידני)` : `${m.name} (${UNIT_LABELS[m.unit]})` })),
      grow: 3,
    },
    { key: "amount", label: "כמות ליחידה אחת", type: "number", grow: 1, disabledFor: (row) => isManual(row.materialId) },
  ];

  const edit = (key: string) => (rows: EditableRow[]) => {
    setSections((s) => ({ ...s, [key]: rows }));
    setMessage(null);
  };

  const save = () => {
    const items = Object.entries(sections).flatMap(([key, rows]) =>
      fromEditableRows(rows, columns).flatMap((r) =>
        r.materialId
          ? [{ optionId: key === BASE ? null : key, materialId: r.materialId, amount: isManual(r.materialId) || !r.amount ? null : Number(r.amount) }]
          : []
      )
    );
    const missing = items.find((i) => i.amount === null && !isManual(i.materialId));
    if (missing) {
      setMessage({ ok: false, text: `חסרה כמות ליחידה עבור "${byId.get(missing.materialId)?.name ?? ""}"` });
      return;
    }
    const stepRows = fromEditableRows(steps, STEP_COLUMNS).map((s) => ({ id: s.id, title: s.title, daysBefore: s.daysBefore || "0" }));
    startTransition(async () => {
      const result = await saveRecipe(productId, { items, steps: stepRows, notes });
      setMessage({ ok: result.ok, text: result.ok ? (result.message ?? "נשמר") : result.message });
    });
  };

  const baseTotals = (sections[BASE] ?? []).flatMap((row) => {
    const material = byId.get(row.materialId ?? "");
    const amount = Number(row.amount);
    return material && material.tracking === "measured" && amount > 0 ? [{ material, amount }] : [];
  });

  // Full recipe for any batch size, from the rows as they are on screen (saved or not).
  const batchCount = Number(batch);
  const ingredientLines = (rows: EditableRow[]) =>
    rows.flatMap((row) => {
      const material = byId.get(row.materialId ?? "");
      if (!material) return [];
      const amount = Number(row.amount);
      const text = material.tracking === "manual" || !(amount > 0) ? "לפי הצורך" : formatAmount(amount * batchCount, material.unit);
      return [{ name: material.name, text }];
    });
  const batchSections = [
    { key: BASE, title: "בסיס", lines: ingredientLines(sections[BASE] ?? []) },
    ...options.map((o) => ({ key: o.id, title: `טעם: ${o.label}`, lines: ingredientLines(sections[o.id] ?? []) })),
  ].filter((s) => s.lines.length > 0);
  const batchSteps = fromEditableRows(steps, STEP_COLUMNS).filter((s) => s.title);

  return (
    <div className={styles.editor}>
      <Panel title="בסיס – משותף לכל הטעמים" description="בצק, מלית וכל מה שזהה בכל הטעמים. כמות להכנת יחידה אחת (קיש אחד).">
        <RowsField columns={columns} rows={sections[BASE] ?? []} onChange={edit(BASE)} maxRows={60} addLabel="הוספת רכיב" emptyText="אין עדיין רכיבים בבסיס." />
      </Panel>

      {options.map((option) => (
        <Panel key={option.id} title={`טעם: ${option.label}`} description="רק מה שמיוחד לטעם הזה. נספר רק כשהלקוח בחר בו.">
          <RowsField
            columns={columns}
            rows={sections[option.id] ?? []}
            onChange={edit(option.id)}
            maxRows={30}
            addLabel="הוספת רכיב לטעם"
            emptyText="אין רכיבים מיוחדים לטעם הזה."
          />
        </Panel>
      ))}

      <Panel title="שלבי הכנה" description="מה עושים וכמה ימים לפני האיסוף. משמש לתוכנית העבודה.">
        <RowsField
          columns={STEP_COLUMNS}
          rows={steps}
          onChange={(rows) => {
            setSteps(rows);
            setMessage(null);
          }}
          maxRows={30}
          addLabel="הוספת שלב"
          emptyText="אין שלבי הכנה. למשל: בצק ותחתיות – יומיים לפני; מלית ואפייה – יום לפני; אריזה – ביום האיסוף."
        />
      </Panel>

      <Panel title="הערות שלי" description="מה למדת כשהכנת: כמה יצא, מה שינית, מה עדיף. רק בניהול – לקוחות לא רואים.">
        <label htmlFor="recipe-notes" className={styles.visuallyHidden}>
          הערות שלי
        </label>
        <textarea
          id="recipe-notes"
          rows={5}
          maxLength={2000}
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setMessage(null);
          }}
          placeholder="למשל: יצא 15 לחמניות בגודל מעולה. במקום הברשת ביצה – פידור קמח."
          className={styles.notes}
        />
      </Panel>

      {(batchSections.length > 0 || batchSteps.length > 0 || notes.trim()) && (
        <Panel title="מתכון מלא" description="כותבים כמה יחידות מכינים ומקבלים את כל הכמויות ואת שלבי ההכנה. רק לתצוגה – לא משנה את המתכון השמור.">
          <div className={styles.batchField}>
            <label htmlFor="recipe-batch">כמה יחידות מכינים?</label>
            <input
              id="recipe-batch"
              type="number"
              inputMode="numeric"
              min={1}
              max={10000}
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className={styles.batchInput}
            />
          </div>
          {batchCount > 0 ? (
            <div className={styles.fullRecipe}>
              {batchSections.map((section) => (
                <section key={section.key}>
                  {batchSections.length > 1 && <h3 className={styles.fullRecipeHeading}>{section.title}</h3>}
                  <ul role="list" className={styles.preview}>
                    {section.lines.map((line) => (
                      <li key={line.name}>
                        <strong>{line.text}</strong> {line.name}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              {batchSteps.length > 0 && (
                <section>
                  <h3 className={styles.fullRecipeHeading}>שלבי הכנה</h3>
                  <ol className={styles.steps}>
                    {batchSteps.map((step, i) => (
                      <li key={step.id ?? i}>{step.title}</li>
                    ))}
                  </ol>
                </section>
              )}
              {notes.trim() && (
                <section>
                  <h3 className={styles.fullRecipeHeading}>הערות שלי</h3>
                  <p className={styles.notesText}>{notes.trim()}</p>
                </section>
              )}
            </div>
          ) : (
            <p className={styles.muted}>כותבים מספר יחידות גדול מ-0.</p>
          )}
        </Panel>
      )}

      {sizes.length > 0 && baseTotals.length > 0 && (
        <Panel title="תצוגה מקדימה" description="כמה צורך מארז אחד מכל גודל (בסיס בלבד, בלי רכיבי הטעם).">
          <ul role="list" className={styles.preview}>
            {sizes.map((size) => (
              <li key={size.label}>
                <strong>
                  {size.label} ({size.unitCount} יח׳):
                </strong>{" "}
                {baseTotals.map((t) => `${formatAmount(wholeUnits(t.amount * size.unitCount), t.material.unit)} ${t.material.name}`).join(" · ")}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className={styles.saveBar}>
        <Button disabled={isPending} onClick={save} className={styles.saveButton}>
          {isPending ? "שומרים…" : "שמירת המתכון"}
        </Button>
        {message && (
          <p role={message.ok ? "status" : "alert"} className={message.ok ? styles.success : styles.error}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}

function toSections(saved: Record<string, Record<string, string>[]>): Record<string, EditableRow[]> {
  return Object.fromEntries(Object.entries(saved).map(([key, rows]) => [key, toEditableRows(rows)]));
}
