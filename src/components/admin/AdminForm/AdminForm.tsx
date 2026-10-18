"use client";

import clsx from "clsx";
import { startTransition, useActionState, useRef, type ReactNode } from "react";

import { Button } from "@/components/ui/Button/Button";
import type { AdminActionResult } from "@/lib/auth/admin";

import styles from "./AdminForm.module.css";

type AdminFormProps = {
  action: (prev: AdminActionResult | null, formData: FormData) => Promise<AdminActionResult>;
  submitLabel?: string;
  children: ReactNode;
  className?: string;
  /** Clear the fields after a successful save (forms that add a new item). */
  resetOnSuccess?: boolean;
};

/** Form wired to an admin Server Action, with pending state and a success/error message. */
export function AdminForm({ action, submitLabel = "שמירה", children, className, resetOnSuccess = false }: AdminFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(async (prev: AdminActionResult | null, formData: FormData) => {
    const result = await action(prev, formData);
    if (result.ok && resetOnSuccess) formRef.current?.reset();
    return result;
  }, null);

  return (
    <form
      ref={formRef}
      className={clsx(styles.form, className)}
      onSubmit={(event) => {
        // Submit without React's automatic reset, so typed values survive a rejected save.
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
      {children}
      <div className={styles.footer}>
        <Button type="submit" disabled={isPending}>
          {isPending ? "שומרים…" : submitLabel}
        </Button>
        {state && (
          <p role={state.ok ? "status" : "alert"} className={state.ok ? styles.success : styles.error}>
            {state.ok ? (state.message ?? "נשמר") : state.message}
          </p>
        )}
      </div>
    </form>
  );
}
