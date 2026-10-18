"use client";

import { useOptimistic, useTransition } from "react";

import { setStepDone } from "@/app/admin/(panel)/production/actions";

import styles from "./PrepTaskCheck.module.css";

type PrepTaskCheckProps = {
  stepId: string;
  pickupDate: string;
  done: boolean;
  children: React.ReactNode;
};

/** A prep task with a checkbox that saves right away. */
export function PrepTaskCheck({ stepId, pickupDate, done, children }: PrepTaskCheckProps) {
  const [checked, setChecked] = useOptimistic(done);
  const [isPending, startTransition] = useTransition();

  return (
    <label className={styles.task} data-done={checked || undefined}>
      <input
        type="checkbox"
        checked={checked}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.checked;
          startTransition(async () => {
            setChecked(next);
            await setStepDone(stepId, pickupDate, next);
          });
        }}
        className={styles.box}
      />
      <span className={styles.text}>{children}</span>
    </label>
  );
}
