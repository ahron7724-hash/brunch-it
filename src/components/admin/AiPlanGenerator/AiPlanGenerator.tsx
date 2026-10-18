"use client";

import { useState, useTransition } from "react";

import { generateAiPlan } from "@/app/admin/(panel)/production/actions";
import { Button } from "@/components/ui/Button/Button";

import styles from "./AiPlanGenerator.module.css";

type AiPlanGeneratorProps = { from: string; to: string; hasPlan: boolean };

/** Creates (or recreates) the AI plan for the shown range, with optional notes for this plan. */
export function AiPlanGenerator({ from, to, hasPlan }: AiPlanGeneratorProps) {
  const [instructions, setInstructions] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className={styles.form}>
      <label className={styles.field}>
        <span className={styles.label}>הערות לתכנון הזה (לא חובה)</span>
        <input
          type="text"
          maxLength={1000}
          value={instructions}
          placeholder="למשל: ביום שני אני לא עובדת · להקפיא בצקים מראש"
          onChange={(e) => setInstructions(e.target.value)}
          className={styles.input}
        />
      </label>
      <div className={styles.footer}>
        <Button
          disabled={isPending}
          onClick={() => {
            setMessage(null);
            startTransition(async () => {
              const result = await generateAiPlan(from, to, instructions);
              setMessage({ ok: result.ok, text: result.ok ? (result.message ?? "התוכנית מוכנה") : result.message });
            });
          }}
        >
          {isPending ? "ה-AI מתכנן… (עד דקה)" : hasPlan ? "תכנון מחדש עם AI" : "תכנון עם AI"}
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
