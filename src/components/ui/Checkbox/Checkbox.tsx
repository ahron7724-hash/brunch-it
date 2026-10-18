import styles from "./Checkbox.module.css";

type CheckboxProps = {
  id: string;
  name: string;
  label: string;
  defaultChecked?: boolean;
  value?: string;
};

export function Checkbox({ id, name, label, defaultChecked, value = "on" }: CheckboxProps) {
  return (
    <label htmlFor={id} className={styles.label}>
      <input id={id} type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className={styles.box} />
      <span>{label}</span>
    </label>
  );
}
