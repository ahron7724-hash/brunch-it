import { Button } from "@/components/ui/Button/Button";

import styles from "./RangeFilter.module.css";

type RangeFilterProps = { from: string; to: string };

/** Pickup date range as a plain GET form (works without JavaScript). */
export function RangeFilter({ from, to }: RangeFilterProps) {
  return (
    <form method="get" className={styles.form}>
      <label className={styles.field}>
        <span>מתאריך איסוף</span>
        <input type="date" name="from" defaultValue={from} required className={styles.input} />
      </label>
      <label className={styles.field}>
        <span>עד</span>
        <input type="date" name="to" defaultValue={to} required className={styles.input} />
      </label>
      <Button type="submit" variant="line">
        הצגה
      </Button>
    </form>
  );
}
