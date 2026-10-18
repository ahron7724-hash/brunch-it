"use client";

import clsx from "clsx";

import { Button } from "@/components/ui/Button/Button";

import styles from "./status.module.css";

type ErrorProps = { error: Error & { digest?: string }; reset: () => void };

export default function ErrorPage({ reset }: ErrorProps) {
  return (
    <div className={clsx("container", "stack", styles.status)}>
      <h1 className={styles.title}>משהו השתבש</h1>
      <p className={styles.text}>לא הצלחנו לטעון את העמוד. נסו שוב בעוד רגע.</p>
      <Button onClick={reset}>ניסיון נוסף</Button>
    </div>
  );
}
