"use client";

import clsx from "clsx";
import { useState, useTransition } from "react";

import { recordStock, type StockReason } from "@/app/admin/(panel)/inventory/actions";
import { Button } from "@/components/ui/Button/Button";
import { formatAmount, groupByCategory, UNIT_LABELS, type Material, type MaterialCategory } from "@/lib/inventory/calc";

import styles from "./StockForm.module.css";

const MODES: { value: StockReason; label: string; hint: string; column: string; submit: string }[] = [
  { value: "purchase", label: "קליטת קנייה", hint: "כמה נקנה – מתווסף למלאי.", column: "כמות שנקנתה", submit: "הוספה למלאי" },
  { value: "count", label: "ספירת מלאי", hint: "כמה יש בפועל – המלאי מתעדכן לכמות הזו.", column: "כמות בפועל", submit: "שמירת הספירה" },
  { value: "usage", label: "שימוש ידני", hint: "כמה ירד (ירקות, או תיקון) – יורד מהמלאי.", column: "כמה ירד", submit: "הורדה מהמלאי" },
];

type StockFormProps = { materials: (Material & { categoryId: string | null })[]; categories: MaterialCategory[] };

/** The stock table, with one input per material for a purchase, a count or manual usage. */
export function StockForm({ materials, categories }: StockFormProps) {
  const groups = groupByCategory(materials, categories);
  const [reason, setReason] = useState<StockReason>("purchase");
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const mode = MODES.find((m) => m.value === reason) ?? MODES[0]!;

  const submit = () => {
    const items = Object.entries(amounts).flatMap(([id, value]) => (value.trim() === "" ? [] : [{ id, amount: Number(value) }]));
    if (items.length === 0) {
      setMessage({ ok: false, text: "לא הוזנו כמויות" });
      return;
    }
    startTransition(async () => {
      const result = await recordStock({ reason, items, note: note || undefined });
      setMessage({ ok: result.ok, text: result.ok ? (result.message ?? "נשמר") : result.message });
      if (result.ok) {
        setAmounts({});
        setNote("");
      }
    });
  };

  return (
    <div className={styles.form}>
      <div role="radiogroup" aria-label="סוג העדכון" className={styles.modes}>
        {MODES.map((m) => (
          <label key={m.value} className={clsx(styles.mode, reason === m.value && styles.modeActive)}>
            <input
              type="radio"
              name="stock-reason"
              value={m.value}
              checked={reason === m.value}
              onChange={() => {
                setReason(m.value);
                setMessage(null);
              }}
              className="visually-hidden"
            />
            {m.label}
          </label>
        ))}
      </div>
      <p className={styles.hint}>{mode.hint} שורות ריקות לא משתנות.</p>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">חומר גלם</th>
              <th scope="col">במלאי</th>
              <th scope="col">{mode.column}</th>
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.id ?? "none"}>
              {groups.length > 1 && (
                <tr>
                  <th scope="colgroup" colSpan={3} className={styles.group}>
                    {group.name}
                  </th>
                </tr>
              )}
              {group.items.map((m) => {
                const low = m.currentStock < m.minStockAlert || m.currentStock < 0;
                return (
                  <tr key={m.id}>
                    <th scope="row" className={styles.name}>
                      {m.name}
                      {m.tracking === "manual" && <span className={styles.tag}>ידני</span>}
                    </th>
                    <td className={clsx(styles.num, low && styles.low)}>
                      {formatAmount(m.currentStock, m.unit)}
                      {low && <span className={styles.lowLabel}>{m.currentStock < 0 ? "חוסר" : "מתחת לסף"}</span>}
                    </td>
                    <td>
                      <label className={styles.amount}>
                        <span className="visually-hidden">
                          {mode.column} – {m.name}
                        </span>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          inputMode="decimal"
                          value={amounts[m.id] ?? ""}
                          onChange={(e) => setAmounts((a) => ({ ...a, [m.id]: e.target.value }))}
                          className={styles.input}
                        />
                        <span className={styles.unit}>{UNIT_LABELS[m.unit]}</span>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>

      <label className={styles.note}>
        <span>הערה (לא חובה)</span>
        <input type="text" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} className={styles.input} />
      </label>

      <div className={styles.footer}>
        <Button disabled={isPending} onClick={submit}>
          {isPending ? "שומרים…" : mode.submit}
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
