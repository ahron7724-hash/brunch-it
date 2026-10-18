import styles from "./ProductPurchase.module.css";

type CustomTextFieldProps = {
  label: string | null;
  value: string;
  onChange: (value: string) => void;
  max: number;
};

/** Optional free text written on the product (e.g. a cake inscription), with a character counter. */
export function CustomTextField({ label, value, onChange, max }: CustomTextFieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor="custom-text" className={styles.legend}>
        {label ?? "כיתוב אישי"} <span className={styles.optional}>(לא חובה)</span>
      </label>
      <input
        id="custom-text"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={max}
        className={styles.input}
        aria-describedby="custom-text-hint"
      />
      <span id="custom-text-hint" className={styles.hint}>
        <span className="ltr">
          {value.length}/{max}
        </span>
      </span>
    </div>
  );
}
