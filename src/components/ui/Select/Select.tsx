import styles from "./Select.module.css";

type SelectProps = {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  name?: string;
};

export function Select({ id, label, options, defaultValue, name = id }: SelectProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <select id={id} name={name} defaultValue={defaultValue} className={styles.select}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
