"use client";

import { deleteTray } from "@/app/admin/(panel)/trays/actions";
import { DeleteButton } from "@/components/admin/DeleteButton/DeleteButton";
import { Panel } from "@/components/admin/Panel/Panel";

type TrayDeleteProps = { trayId: string };

export function TrayDelete({ trayId }: TrayDeleteProps) {
  return (
    <Panel title="מחיקת המגש" description="המגש יימחק לצמיתות, כולל הגדלים, הפריטים והתמונות. הזמנות קודמות נשמרות.">
      <DeleteButton label="מחיקת המגש" confirmText="למחוק את המגש לצמיתות?" onDelete={() => deleteTray(trayId)} />
    </Panel>
  );
}
