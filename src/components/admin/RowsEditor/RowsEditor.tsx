"use client";

import { useState, useTransition } from "react";

import { fromEditableRows, RowsField, toEditableRows, type Column } from "@/components/admin/RowsField/RowsField";
import { Button } from "@/components/ui/Button/Button";
import type { AdminActionResult } from "@/lib/auth/admin";

import styles from "./RowsEditor.module.css";

export type { Column };

type RowsEditorProps = {
  columns: Column[];
  initialRows: Record<string, string>[];
  maxRows: number;
  addLabel: string;
  emptyText?: string;
  onSave: (rows: Record<string, string>[]) => Promise<AdminActionResult>;
};

/** A row list with its own save button (delivery zones, weekday time slots). */
export function RowsEditor({ columns, initialRows, maxRows, addLabel, emptyText, onSave }: RowsEditorProps) {
  const [rows, setRows] = useState(() => toEditableRows(initialRows));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className={styles.editor}>
      <RowsField columns={columns} rows={rows} onChange={setRows} maxRows={maxRows} addLabel={addLabel} emptyText={emptyText} />
      <div className={styles.footer}>
        <Button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await onSave(fromEditableRows(rows, columns));
              // New rows get their database ids, so the next save updates instead of re-inserting.
              const ids = result.ok ? result.ids : undefined;
              if (ids) setRows((list) => list.map((r, i) => (ids[i] ? { ...r, id: ids[i] } : r)));
              setMessage({ ok: result.ok, text: result.ok ? (result.message ?? "נשמר") : result.message });
            })
          }
        >
          {isPending ? "שומרים…" : "שמירה"}
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
