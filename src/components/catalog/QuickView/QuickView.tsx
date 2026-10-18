"use client";

import { Eye } from "lucide-react";
import { useState, useTransition } from "react";

import { loadQuickView } from "@/app/(site)/actions";
import { Modal } from "@/components/ui/Modal/Modal";
import type { ProductDetail } from "@/lib/data/types";

import styles from "./QuickView.module.css";
import { QuickViewContent } from "./QuickViewContent";

type QuickViewProps = {
  productId: string;
  title: string;
  /** Class for the box around the button (the card positions it and decides when it shows). */
  className?: string;
};

/** "Quick view" button on a product card; opens the product in a popup window. */
export function QuickView({ productId, title, className }: QuickViewProps) {
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function show() {
    setOpen(true);
    if (product) return;
    setFailed(false);
    startTransition(async () => {
      const detail = await loadQuickView(productId);
      if (detail) setProduct(detail);
      else setFailed(true);
    });
  }

  return (
    <>
      {/* The popup is a sibling of this box, so hiding the box (mouse leaves the card) never hides the popup. */}
      <div className={className}>
        <button type="button" className={styles.trigger} onClick={show} aria-label={`צפייה מהירה: ${title}`}>
          <Eye size={16} strokeWidth={1.5} aria-hidden="true" />
          <span>צפייה מהירה</span>
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={title} variant="wide">
        {isPending && <p className={styles.status}>טוען…</p>}
        {failed && <p className={styles.status}>לא הצלחנו לטעון את המוצר. נסו שוב.</p>}
        {product && !isPending && <QuickViewContent product={product} onAdded={() => setOpen(false)} />}
      </Modal>
    </>
  );
}
