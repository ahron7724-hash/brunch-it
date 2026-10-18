"use client";

import { saveMaterialCategories } from "@/app/admin/(panel)/inventory/actions";
import { RowsEditor } from "@/components/admin/RowsEditor/RowsEditor";

type MaterialCategoriesEditorProps = { categories: Record<string, string>[] };

export function MaterialCategoriesEditor({ categories }: MaterialCategoriesEditorProps) {
  return (
    <RowsEditor
      columns={[{ key: "name", label: "שם הקטגוריה", placeholder: "למשל: בסיס חלבי", maxLength: 60 }]}
      initialRows={categories}
      maxRows={50}
      addLabel="הוספת קטגוריה"
      emptyText="עדיין אין קטגוריות."
      onSave={saveMaterialCategories}
    />
  );
}
