import styles from "./ColorField.module.css";

type ColorFieldProps = { id: string; name?: string; label: string; defaultValue: string; hint?: string };

export function ColorField({ id, name = id, label, defaultValue, hint }: ColorFieldProps) {
  return (
    <label htmlFor={id} className={styles.field}>
      <input id={id} name={name} type="color" defaultValue={defaultValue} className={styles.swatch} />
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </span>
    </label>
  );
}
