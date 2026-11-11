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
  selected: string[];
  onChange: (ids: string[]) => void;
  /** 1 = a radio group (one choice); more = checkboxes, up to this many. */
  max?: number;
};

/** Accessible radio or checkbox group rendered as selectable tiles (sizes, flavors). */
export function ChoiceGroup({ name, legend, choices, selected, onChange, max = 1 }: ChoiceGroupProps) {
  const multiple = max > 1;
  const full = selected.length >= max;
  const hintId = `${name}-hint`;

  function toggle(id: string) {
    if (!multiple) return onChange([id]);
    if (selected.includes(id)) return onChange(selected.filter((s) => s !== id));
    if (!full) onChange([...selected, id]);
  }

  return (
    <fieldset className={styles.fieldset} aria-describedby={multiple ? hintId : undefined}>
      <legend className={styles.legend}>
        {legend}
        {multiple && (
          <span id={hintId} className={styles.optional}>
            {" "}
            (אפשר לבחור עד {max} · נבחרו {selected.length})
          </span>
        )}
      </legend>
      <div className={styles.choices}>
        {choices.map((choice) => {
          const id = `${name}-${choice.id}`;
          const checked = selected.includes(choice.id);
          const disabled = multiple && !checked && full;
          return (
            <label key={choice.id} htmlFor={id} className={clsx(styles.choice, checked && styles.choiceActive, disabled && styles.choiceDisabled)}>
              <input
                id={id}
                type={multiple ? "checkbox" : "radio"}
                name={name}
                value={choice.id}
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(choice.id)}
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
