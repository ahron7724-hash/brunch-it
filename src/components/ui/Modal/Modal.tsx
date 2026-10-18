"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import styles from "./Modal.module.css";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** When false the dialog cannot be dismissed (e.g. a required choice). */
  dismissible?: boolean;
  /** "drawer" slides in from the side (the cart); "wide" is a large centered window (quick view). */
  variant?: "center" | "drawer" | "wide";
};

/** Accessible modal on the native <dialog> element (focus trap and Esc built in). */
export function Modal({ open, onClose, title, children, dismissible = true, variant = "center" }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  // Sync the `open` prop with the dialog element's own imperative API.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      className={clsx(styles.dialog, variant === "drawer" && styles.drawer, variant === "wide" && styles.wide)}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.body}>
        <div className={styles.head}>
          <h2 className={styles.title}>{title}</h2>
          {dismissible && (
            <button type="button" onClick={onClose} aria-label="סגירה" className={styles.close}>
              <X size={20} strokeWidth={1.25} aria-hidden="true" />
            </button>
          )}
        </div>
        {children}
      </div>
    </dialog>
  );
}
