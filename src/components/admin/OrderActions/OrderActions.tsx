"use client";

import { deleteOrder } from "@/app/admin/(panel)/orders/actions";
import { DeleteButton } from "@/components/admin/DeleteButton/DeleteButton";

type OrderActionsProps = { orderId: string };

export function OrderActions({ orderId }: OrderActionsProps) {
  return <DeleteButton label="מחיקת ההזמנה" confirmText="למחוק את ההזמנה לצמיתות?" onDelete={() => deleteOrder(orderId)} />;
}
