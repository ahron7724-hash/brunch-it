"use client";

import { deleteProduct } from "@/app/admin/(panel)/products/actions";
import { DeleteButton } from "@/components/admin/DeleteButton/DeleteButton";
import { Panel } from "@/components/admin/Panel/Panel";

type ProductDeleteProps = { productId: string };

export function ProductDelete({ productId }: ProductDeleteProps) {
  return (
    <Panel title="מחיקת המוצר" description="המוצר יימחק לצמיתות, כולל התמונות שלו. הזמנות קודמות נשמרות.">
      <DeleteButton label="מחיקת המוצר" confirmText="למחוק את המוצר לצמיתות?" onDelete={() => deleteProduct(productId)} />
    </Panel>
  );
}
