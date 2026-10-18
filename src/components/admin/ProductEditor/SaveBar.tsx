import { Button } from "@/components/ui/Button/Button";
import type { AdminActionResult } from "@/lib/auth/admin";

import styles from "./ProductEditor.module.css";

type SaveBarProps = {
  pending: boolean;
  dirty: boolean;
  result: AdminActionResult | null;
};

/** Sticky bar at the bottom of the product page: the single save button and the save status. */
export function SaveBar({ pending, dirty, result }: SaveBarProps) {
  // Priority: saving → the result of the last save (until the next edit) → unsaved changes.
  const status = pending
    ? { tone: styles.statusMuted, text: "שומרים…" }
    : result
      ? { tone: result.ok ? styles.statusOk : styles.statusError, text: result.ok ? (result.message ?? "נשמר") : `לא נשמר: ${result.message}` }
      : dirty
        ? { tone: styles.statusDirty, text: "יש שינויים שלא נשמרו" }
        : null;

  return (
    <div className={styles.saveBar}>
      <Button type="submit" disabled={pending} className={styles.saveButton}>
        {pending ? "שומרים…" : "שמירת המוצר"}
      </Button>
      {status && (
        <p role={result && !result.ok ? "alert" : "status"} className={status.tone}>
          {status.text}
        </p>
      )}
    </div>
  );
}
