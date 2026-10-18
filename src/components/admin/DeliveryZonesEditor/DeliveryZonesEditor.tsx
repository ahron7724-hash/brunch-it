"use client";

import { saveZones } from "@/app/admin/(panel)/delivery/actions";
import { RowsEditor } from "@/components/admin/RowsEditor/RowsEditor";

type DeliveryZonesEditorProps = { zones: Record<string, string>[] };

export function DeliveryZonesEditor({ zones }: DeliveryZonesEditorProps) {
  return (
    <RowsEditor
      columns={[
        { key: "name", label: "אזור", placeholder: "למשל: תל אביב והסביבה", maxLength: 80, grow: 3 },
        { key: "price", label: "מחיר משלוח (₪)", type: "number", grow: 1 },
        { key: "minOrder", label: "מינימום הזמנה (₪)", type: "number", grow: 1 },
      ]}
      initialRows={zones}
      maxRows={30}
      addLabel="הוספת אזור"
      emptyText="אין אזורי משלוח. בלי אזורים, הקופה תציע איסוף עצמי בלבד."
      onSave={saveZones}
    />
  );
}
