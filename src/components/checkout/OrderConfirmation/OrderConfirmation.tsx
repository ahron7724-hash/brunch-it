import clsx from "clsx";

import { ButtonLink } from "@/components/ui/Button/Button";

import styles from "./OrderConfirmation.module.css";

type OrderConfirmationProps = { orderNumber: number };

export function OrderConfirmation({ orderNumber }: OrderConfirmationProps) {
  return (
    <section className={clsx("container", styles.confirmation)} role="status" aria-live="polite">
      <span className="eyebrow">הזמנה מספר {orderNumber}</span>
      <h2 className={styles.title}>תודה! ההזמנה התקבלה</h2>
      <p className={styles.text}>
        שלחנו אליכם אישור בדוא״ל. נעבור על ההזמנה ונחזור אליכם לאישור סופי ולתיאום התשלום.
      </p>
      <ButtonLink href="/" variant="line">
        חזרה לדף הבית
      </ButtonLink>
    </section>
  );
}
