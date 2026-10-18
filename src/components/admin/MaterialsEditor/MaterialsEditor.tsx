"use client";

import { saveMaterials } from "@/app/admin/(panel)/inventory/actions";
import { RowsEditor } from "@/components/admin/RowsEditor/RowsEditor";
import { UNIT_LABELS, UNITS } from "@/lib/inventory/calc";

type MaterialsEditorProps = { materials: Record<string, string>[]; categories: { id: string; name: string }[] };

export function MaterialsEditor({ materials, categories }: MaterialsEditorProps) {
  return (
    <RowsEditor
      columns={[
        { key: "name", label: "שם", placeholder: "למשל: קמח לבן", maxLength: 80, grow: 3 },
        {
          key: "categoryId",
          label: "קטגוריה",
          type: "select",
          placeholder: "ללא קטגוריה",
          choices: categories.map((c) => ({ value: c.id, label: c.name })),
          grow: 2,
        },
        { key: "unit", label: "יחידת מידה", type: "select", choices: UNITS.map((u) => ({ value: u, label: UNIT_LABELS[u] })), grow: 1 },
        {
          key: "tracking",
          label: "מעקב",
          type: "select",
          choices: [
            { value: "measured", label: "נמדד – יורד אוטומטית" },
            { value: "manual", label: "ידני (ירקות)" },
          ],
          grow: 2,
        },
        { key: "minStockAlert", label: "התראה מתחת ל־", type: "number", grow: 1 },
      ]}
      initialRows={materials}
      maxRows={500}
      addLabel="הוספת חומר גלם"
      emptyText="עדיין אין חומרי גלם. מוסיפים כאן, ואז אפשר לבנות מתכונים בעמוד של כל מוצר."
      onSave={saveMaterials}
    />
  );
}
