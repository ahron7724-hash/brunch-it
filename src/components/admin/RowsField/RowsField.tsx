"use client";

import { Plus } from "lucide-react";
import type { CSSProperties } from "react";

import styles from "./RowsField.module.css";

export type Column = {
  key: string;
  label: string;
  type?: "text" | "number" | "time" | "select";
  /** Choices for a "select" column. */
  choices?: { value: string; label: string }[];
  /** Disables the cell for some rows (e.g. no amount for a manual material). */
  disabledFor?: (row: EditableRow) => boolean;
  placeholder?: string;
  maxLength?: number;
  /** Relative width (flex-grow). */
  grow?: number;
  dir?: "ltr";
};

export type EditableRow = Record<string, string> & { _key: string; id?: string };

type RowsFieldProps = {
  columns: Column[];
  rows: EditableRow[];
  onChange: (rows: EditableRow[]) => void;
  maxRows: number;
  addLabel: string;
  emptyText?: string;
};

/** Controlled list of editable rows (sizes, flavors, zones, time slots). Saving is up to the parent. */
export function RowsField({ columns, rows, onChange, maxRows, addLabel, emptyText }: RowsFieldProps) {
  const update = (key: string, field: string, value: string) =>
    onChange(rows.map((r) => (r._key === key ? { ...r, [field]: value } : r)));

  return (
    <div className={styles.field}>
      {rows.length === 0 && emptyText && <p className={styles.empty}>{emptyText}</p>}
      <ul role="list" className={styles.rows}>
        {rows.map((row, index) => (
          <li key={row._key} className={styles.row}>
            {columns.map((col) => (
              <label key={col.key} className={styles.cell} style={growStyle(col.grow ?? 1)}>
                <span className={index === 0 ? styles.cellLabel : "visually-hidden"}>{col.label}</span>
                {col.type === "select" ? (
                  <select
                    value={row[col.key] ?? ""}
                    disabled={col.disabledFor?.(row)}
                    onChange={(e) => update(row._key, col.key, e.target.value)}
                    className={styles.input}
                  >
                    {col.placeholder && <option value="">{col.placeholder}</option>}
                    {col.choices?.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={col.type ?? "text"}
                    value={col.disabledFor?.(row) ? "" : (row[col.key] ?? "")}
                    placeholder={col.disabledFor?.(row) ? "—" : col.placeholder}
                    disabled={col.disabledFor?.(row)}
                    maxLength={col.maxLength ?? 120}
                    min={col.type === "number" ? 0 : undefined}
                    step={col.type === "number" ? "any" : undefined}
                    dir={col.dir}
                    onChange={(e) => update(row._key, col.key, e.target.value)}
                    className={styles.input}
                  />
                )}
              </label>
            ))}
            <button
              type="button"
              className={styles.remove}
              onClick={() => onChange(rows.filter((r) => r._key !== row._key))}
              aria-label={`הסרת שורה ${index + 1}`}
            >
              הסרה
            </button>
          </li>
        ))}
      </ul>
      {rows.length < maxRows && (
        <button type="button" className={styles.add} onClick={() => onChange([...rows, newRow(columns)])}>
          <Plus size={16} strokeWidth={1.25} aria-hidden="true" /> {addLabel}
        </button>
      )}
    </div>
  );
}

/** Rows from plain records, each with a stable React key. */
export function toEditableRows(records: Record<string, string>[]): EditableRow[] {
  return records.map((r) => ({ ...r, _key: r.id ?? crypto.randomUUID() }));
}

/** Rows as plain records (id + column values) for sending to the server. */
export function fromEditableRows(rows: EditableRow[], columns: Column[]): Record<string, string>[] {
  return rows.map((row) => ({
    ...(row.id ? { id: row.id } : {}),
    ...Object.fromEntries(columns.map((c) => [c.key, row[c.key] ?? ""])),
  }));
}

function newRow(columns: Column[]): EditableRow {
  // A select without a placeholder starts on its first choice, as the browser shows it.
  const initial = (c: Column) => (c.type === "select" && !c.placeholder ? (c.choices?.[0]?.value ?? "") : "");
  return { _key: crypto.randomUUID(), ...Object.fromEntries(columns.map((c) => [c.key, initial(c)])) };
}

/** Passes a column's relative width to CSS as a custom property (the one allowed inline style). */
function growStyle(grow: number): CSSProperties & Record<"--grow", number> {
  return { "--grow": grow };
}
