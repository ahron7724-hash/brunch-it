"use client";

import { deleteCategory } from "@/app/admin/(panel)/categories/actions";
import { DeleteButton } from "@/components/admin/DeleteButton/DeleteButton";

type CategoryDeleteProps = { categoryId: string };

export function CategoryDelete({ categoryId }: CategoryDeleteProps) {
  return (
    <DeleteButton
      label="מחיקת הקטגוריה"
      confirmText="למחוק? המוצרים עצמם לא יימחקו."
      onDelete={() => deleteCategory(categoryId)}
    />
  );
}
