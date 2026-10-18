"use client";

import { Button } from "@/components/ui/Button/Button";

import styles from "./PrintShare.module.css";

type PrintShareProps = {
  /** Plain-text version for WhatsApp. */
  text: string;
};

/** Print the page, or send the list as a WhatsApp message. */
export function PrintShare({ text }: PrintShareProps) {
  return (
    <div className={styles.actions}>
      <Button variant="line" onClick={() => window.print()}>
        הדפסה
      </Button>
      <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className={styles.link}>
        שליחה בוואטסאפ ↗
      </a>
    </div>
  );
}
