"use client";

import { Eye, EyeOff, Pencil } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { deleteProduct, setProductActive } from "@/app/admin/(panel)/products/actions";
import { DeleteButton } from "@/components/admin/DeleteButton/DeleteButton";

import styles from "./ProductRowActions.module.css";

type ProductRowActionsProps = { productId: string; title: string; isActive: boolean };

/** Edit, show/hide and delete buttons on one product in the admin list. */
export function ProductRowActions({ productId, title, isActive }: ProductRowActionsProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className={styles.actions}>
      <div className={styles.buttons}>
        <Link href={`/admin/products/${productId}`} className={styles.edit}>
          <Pencil size={16} strokeWidth={1.5} aria-hidden="true" /> עריכה
        </Link>
        <button
          type="button"
          className={styles.icon}
          disabled={isPending}
          aria-label={isActive ? `הסתרת ${title} מהאתר` : `הצגת ${title} באתר`}
          title={isActive ? "הסתרה מהאתר" : "הצגה באתר"}
          onClick={() =>
            startTransition(async () => {
              const result = await setProductActive(productId, !isActive);
              setError(result.ok ? null : result.message);
            })
          }
        >
          {isActive ? <Eye size={18} strokeWidth={1.25} aria-hidden="true" /> : <EyeOff size={18} strokeWidth={1.25} aria-hidden="true" />}
        </button>
        <DeleteButton iconOnly label={`מחיקת ${title}`} confirmText="למחוק לצמיתות?" onDelete={() => deleteProduct(productId)} />
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
