import clsx from "clsx";

import { BidiText } from "@/components/ui/BidiText/BidiText";
import { formatPrice } from "@/lib/format";

import styles from "./ProductPurchase.module.css";

export type Choice = {
  id: string;
  label: string;
  /** Shown next to the label: a full price for sizes, an extra for options. */
  price?: { amount: number; kind: "full" | "extra" };
  note?: string | null;
};

type ChoiceGroupProps = {
  name: string;
  legend: string;
  choices: Choice[];
  value: string;
  onChange: (id: string) => void;
};

/** Accessible radio group rendered as selectable tiles (sizes, flavors). */
export function ChoiceGroup({ name, legend, choices, value, onChange }: ChoiceGroupProps) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.choices}>
        {choices.map((choice) => {
          const id = `${name}-${choice.id}`;
          return (
            <label key={choice.id} htmlFor={id} className={clsx(styles.choice, value === choice.id && styles.choiceActive)}>
              <input
                id={id}
                type="radio"
                name={name}
                value={choice.id}
                checked={value === choice.id}
                onChange={() => onChange(choice.id)}
                className="visually-hidden"
              />
              <span className={styles.choiceLabel}>{choice.label}</span>
              {choice.note && (
                <span className={styles.choiceNote}>
                  <BidiText text={choice.note} />
                </span>
              )}
              {choice.price && choice.price.amount > 0 && (
                <span className={styles.choicePrice}>
                  {choice.price.kind === "extra" && <span aria-label="תוספת">+</span>} {formatPrice(choice.price.amount)}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
