"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import type { AdminActionResult } from "@/lib/auth/admin";

import styles from "./DeleteButton.module.css";

type DeleteButtonProps = {
  onDelete: () => Promise<AdminActionResult>;
  label?: string;
  confirmText?: string;
  /** Show a trash icon instead of a text link (the label becomes its accessible name). */
  iconOnly?: boolean;
};

/** Two-step delete: the first click asks for confirmation inline, the second deletes. */
export function DeleteButton({ onDelete, label = "מחיקה", confirmText = "למחוק? אי אפשר לבטל.", iconOnly = false }: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        className={iconOnly ? styles.iconTrigger : styles.trigger}
        onClick={() => setConfirming(true)}
        aria-label={iconOnly ? label : undefined}
        title={iconOnly ? label : undefined}
      >
        {iconOnly ? <Trash2 size={18} strokeWidth={1.25} aria-hidden="true" /> : label}
      </button>
    );
  }

  return (
    <span className={styles.confirm} role="group" aria-label="אישור מחיקה">
      <span className={styles.question}>{confirmText}</span>
      <button
        type="button"
        className={styles.danger}
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await onDelete();
            if (!result.ok) setError(result.message);
            setConfirming(false);
          })
        }
      >
        {isPending ? "מוחקים…" : "כן, למחוק"}
      </button>
      <button type="button" className={styles.cancel} onClick={() => setConfirming(false)}>
        ביטול
      </button>
      {error && (
        <span role="alert" className={styles.error}>
          {error}
        </span>
      )}
    </span>
  );
}
