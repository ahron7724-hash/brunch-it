"use client";

import clsx from "clsx";
import { useState, useTransition } from "react";

import { updateOrderStatus } from "@/app/admin/(panel)/orders/actions";

import styles from "./OrderStatusSelect.module.css";

type OrderStatusSelectProps = {
  orderId: string;
  status: string;
  options: { value: string; label: string }[];
  label: string;
};

/** Changes an order's status immediately when a new value is picked. */
export function OrderStatusSelect({ orderId, status, options, label }: OrderStatusSelectProps) {
  const [value, setValue] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <span className={styles.wrap}>
      <select
        aria-label={label}
        value={value}
        disabled={isPending}
        className={clsx(styles.select, styles[`status_${value}`])}
        onChange={(e) => {
          const next = e.target.value;
          const previous = value;
          setValue(next);
          setError(null);
          startTransition(async () => {
            const result = await updateOrderStatus(orderId, next);
            if (!result.ok) {
              setValue(previous);
              setError(result.message);
            }
          });
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <span role="alert" className={styles.error}>
          {error}
        </span>
      )}
    </span>
  );
}
