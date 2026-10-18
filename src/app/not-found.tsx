import clsx from "clsx";

import { ButtonLink } from "@/components/ui/Button/Button";

import styles from "./status.module.css";

export default function NotFound() {
  return (
    <div className={clsx("container", "stack", styles.status)}>
      <h1 className={styles.title}>העמוד לא נמצא</h1>
      <p className={styles.text}>ייתכן שהקישור שגוי או שהעמוד הוסר.</p>
      <ButtonLink href="/">חזרה לדף הבית</ButtonLink>
    </div>
  );
}
