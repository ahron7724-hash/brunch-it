"use client";

import { useAvailability } from "@/hooks/useAvailability";

import styles from "./AvailabilityNote.module.css";

type AvailabilityNoteProps = { leadTimeHours: number | null };

/** Small note on a product card when the product can't be ready for the chosen pickup slot. */
export function AvailabilityNote({ leadTimeHours }: AvailabilityNoteProps) {
  const availability = useAvailability(leadTimeHours);
  if (availability.status !== "unavailable") return null;
  return <p className={styles.note}>לא זמין לתאריך שנבחר</p>;
}
