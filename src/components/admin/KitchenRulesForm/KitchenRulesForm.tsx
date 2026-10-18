"use client";

import { useState, useTransition } from "react";

import { saveKitchenRules } from "@/app/admin/(panel)/production/actions";
import { Button } from "@/components/ui/Button/Button";

import styles from "./KitchenRulesForm.module.css";

type KitchenRulesFormProps = { rules: string };

/** The kitchen's rules in free text – what the AI follows when it plans the work days. */
export function KitchenRulesForm({ rules }: KitchenRulesFormProps) {
  const [text, setText] = useState(rules);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className={styles.form}>
      <label className={styles.field}>
        <span className="visually-hidden">כללי המטבח</span>
        <textarea
          rows={7}
          maxLength={4000}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setMessage(null);
          }}
          className={styles.textarea}
        />
      </label>
      <div className={styles.footer}>
        <Button
          variant="line"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await saveKitchenRules(text);
              setMessage({ ok: result.ok, text: result.ok ? (result.message ?? "נשמר") : result.message });
            })
          }
        >
          {isPending ? "שומרים…" : "שמירת הכללים"}
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
