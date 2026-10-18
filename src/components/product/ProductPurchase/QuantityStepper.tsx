import { Minus, Plus } from "lucide-react";

import styles from "./ProductPurchase.module.css";

type QuantityStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export function QuantityStepper({ value, onChange, min = 1, max = 20 }: QuantityStepperProps) {
  return (
    <div className={styles.stepper} role="group" aria-label="כמות">
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="הוספת יחידה"
        className={styles.stepButton}
      >
        <Plus size={16} strokeWidth={1.25} aria-hidden="true" />
      </button>
      <output className={styles.stepValue} aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="הפחתת יחידה"
        className={styles.stepButton}
      >
        <Minus size={16} strokeWidth={1.25} aria-hidden="true" />
      </button>
    </div>
  );
}
