"use client";

import { useState, useTransition } from "react";

import { recordStock } from "@/app/admin/(panel)/inventory/actions";
import { Button } from "@/components/ui/Button/Button";
import { formatAmount, UNIT_LABELS, type ManualUse, type Material } from "@/lib/inventory/calc";

import styles from "./UsageForm.module.css";

type UsageFormProps = {
  rows: { material: Material; uses: ManualUse[] }[];
  /** Saved with the usage in the stock log, e.g. "תוכנית עבודה 3.11–5.11". */
  note: string;
};

/** Vegetables for all orders together, and what each is for; the admin enters how much was used. */
export function UsageForm({ rows, note }: UsageFormProps) {
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    const items = Object.entries(amounts).flatMap(([id, value]) => (value.trim() === "" ? [] : [{ id, amount: Number(value) }]));
    if (items.length === 0) {
      setMessage({ ok: false, text: "לא הוזנו כמויות" });
      return;
    }
    startTransition(async () => {
      const result = await recordStock({ reason: "usage", items, note });
      setMessage({ ok: result.ok, text: result.ok ? (result.message ?? "נשמר") : result.message });
      if (result.ok) setAmounts({});
    });
  };

  return (
    <div className={styles.form}>
      <ul role="list" className={styles.list}>
        {rows.map(({ material, uses }) => (
          <li key={material.id} className={styles.row}>
            <div className={styles.what}>
              <strong className={styles.name}>{material.name}</strong>
              <ul role="list" className={styles.uses}>
                {uses.map((u) => (
                  <li key={u.label}>
                    {u.label}: <span className={styles.num}>{u.units} יח׳</span>
                  </li>
                ))}
              </ul>
              <span className={styles.stock}>במלאי: {formatAmount(material.currentStock, material.unit)}</span>
            </div>
            <label className={styles.amount}>
              <span className={styles.label}>כמה ירד</span>
              <span className={styles.inputRow}>
                <input
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  value={amounts[material.id] ?? ""}
                  onChange={(e) => setAmounts((a) => ({ ...a, [material.id]: e.target.value }))}
                  className={styles.input}
                />
                <span className={styles.unit}>{UNIT_LABELS[material.unit]}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className={styles.footer}>
        <Button disabled={isPending} onClick={submit}>
          {isPending ? "שומרים…" : "הורדה מהמלאי"}
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
