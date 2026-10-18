import clsx from "clsx";

import styles from "../../status.module.css";

export default function Loading() {
  return (
    <div className={clsx("container", styles.status)} role="status">
      <p className={styles.text}>טוען…</p>
    </div>
  );
}
