"use client";

import { useActionState } from "react";

import { sendLoginLink, type LoginState } from "@/app/admin/login/actions";
import { Field } from "@/components/ui/Field/Field";
import { Button } from "@/components/ui/Button/Button";

import styles from "./LoginForm.module.css";

const initialState: LoginState = { ok: false };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(sendLoginLink, initialState);

  if (state.ok) {
    return (
      <p role="status" className={styles.success}>
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} noValidate className={styles.form}>
      <Field id="email" label="דוא״ל" type="email" dir="ltr" maxLength={254} autoComplete="email" error={state.error} />
      <Button type="submit" disabled={isPending}>
        {isPending ? "שולחים…" : "שליחת קישור כניסה"}
      </Button>
    </form>
  );
}
