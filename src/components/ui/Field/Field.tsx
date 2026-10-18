import clsx from "clsx";

import styles from "./Field.module.css";

type FieldProps = {
  id: string;
  /** Form field name; defaults to the id. */
  name?: string;
  label: string;
  error?: string;
  maxLength: number;
  type?: "text" | "email" | "tel" | "number" | "time" | "date" | "url";
  dir?: "ltr" | "rtl";
  multiline?: boolean;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string | number;
  min?: number | string;
  max?: number | string;
  step?: number;
  hint?: string;
  /** Rows for a multiline field. */
  rows?: number;
};

/** Labelled input with its error message linked through aria-describedby. */
export function Field(props: FieldProps) {
  const { id, name = id, label, error, maxLength, type = "text", dir, multiline = false, required = true, autoComplete, defaultValue, min, max, step, hint, rows = 4 } = props;
  const errorId = `${id}-error`;
  const common = {
    id,
    name,
    required,
    maxLength,
    dir,
    autoComplete,
    defaultValue,
    "aria-invalid": Boolean(error),
    "aria-describedby": clsx(error && errorId, hint && `${id}-hint`) || undefined,
    className: clsx(styles.input, error && styles.inputError),
  };

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {!required && <span className={styles.optional}> (לא חובה)</span>}
      </label>
      {multiline ? <textarea rows={rows} {...common} /> : <input type={type} min={min} max={max} step={step} {...common} />}
      {hint && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
