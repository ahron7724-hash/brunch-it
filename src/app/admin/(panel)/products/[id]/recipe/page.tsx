import { notFound } from "next/navigation";

import { AdminHeader } from "@/components/admin/AdminHeader/AdminHeader";
import { RecipeEditor } from "@/components/admin/RecipeEditor/RecipeEditor";
import { getAdminProduct } from "@/lib/admin/products";
import { getRecipeNotes, listMaterials, listPrepSteps, listRecipes } from "@/lib/inventory/data";

type RecipePageProps = { params: Promise<{ id: string }> };

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = await params;
  const [product, materials, recipes, steps, notes] = await Promise.all([
    getAdminProduct(id),
    listMaterials(),
    listRecipes(id),
    listPrepSteps(id),
    getRecipeNotes(id),
  ]);
  if (!product) notFound();

  const sections: Record<string, Record<string, string>[]> = {};
  for (const r of recipes) {
    const key = r.optionId ?? "base";
    (sections[key] ??= []).push({ materialId: r.materialId, amount: r.amountPerUnit === null ? "" : String(r.amountPerUnit) });
  }

  return (
    <>
      <AdminHeader
        title={`מתכון: ${product.title}`}
        description="כמויות ליחידה אחת. המערכת מכפילה במספר היחידות במארז ובמספר המארזים בהזמנה."
        back={{ href: `/admin/products/${product.id}`, label: product.title }}
      />
      <RecipeEditor
        productId={product.id}
        materials={materials}
        options={product.product_options.map((o) => ({ id: o.id, label: o.group_name === "טעם" ? o.label : `${o.group_name}: ${o.label}` }))}
        sizes={product.product_sizes.map((s) => ({ label: s.label, unitCount: s.unit_count }))}
        sections={sections}
        steps={steps.map((s) => ({ id: s.id, title: s.title, daysBefore: String(s.daysBefore) }))}
        notes={notes}
      />
    </>
  );
}
