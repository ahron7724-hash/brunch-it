import { AdminHeader } from "@/components/admin/AdminHeader/AdminHeader";
import { MaterialCategoriesEditor } from "@/components/admin/MaterialCategoriesEditor/MaterialCategoriesEditor";
import { MaterialsEditor } from "@/components/admin/MaterialsEditor/MaterialsEditor";
import { Panel } from "@/components/admin/Panel/Panel";
import { StockForm } from "@/components/admin/StockForm/StockForm";
import { ButtonLink } from "@/components/ui/Button/Button";
import { groupByCategory } from "@/lib/inventory/calc";
import { listMaterialCategories, listMaterials } from "@/lib/inventory/data";

export default async function InventoryPage() {
  const [materials, categories] = await Promise.all([listMaterials(), listMaterialCategories()]);
  // The editor lists materials in category order, like the stock table.
  const sorted = groupByCategory(materials, categories).flatMap((g) => g.items);
  const low = materials.filter((m) => m.currentStock < m.minStockAlert || m.currentStock < 0).length;

  return (
    <>
      <AdminHeader title="מלאי" description={low > 0 ? `${low} חומרי גלם מתחת לסף או בחוסר` : "חומרי גלם, קניות וספירות"}>
        <ButtonLink href="/admin/inventory/shopping" variant="line">
          רשימת קניות
        </ButtonLink>
        <ButtonLink href="/admin/inventory/history" variant="text">
          יומן תנועות
        </ButtonLink>
      </AdminHeader>

      {materials.length > 0 && (
        <Panel
          title="מצב המלאי"
          description="חומרים נמדדים יורדים אוטומטית כשהזמנה מאושרת, וחוזרים אם היא מבוטלת. חומרים ידניים יורדים רק כשמזינים שימוש."
        >
          <StockForm materials={materials} categories={categories} />
        </Panel>
      )}

      <Panel
        title="חומרי גלם"
        description="נמדד: קמח, סוכר, ביצים… – במתכון כותבים כמות ליחידה אחת. ידני: ירקות – במתכון רק מסמנים שהטעם צריך אותם. לכל חומר יחידה אחת קבועה."
      >
        <MaterialsEditor
          categories={categories}
          materials={sorted.map((m) => ({
            id: m.id,
            name: m.name,
            unit: m.unit,
            tracking: m.tracking,
            minStockAlert: String(m.minStockAlert),
            categoryId: m.categoryId ?? "",
          }))}
        />
      </Panel>

      <Panel title="קטגוריות" description="החלוקה של חומרי הגלם בטבלת המלאי ובעריכה. הסדר כאן הוא סדר ההצגה. מחיקת קטגוריה לא מוחקת את החומרים – הם עוברים ל״ללא קטגוריה״.">
        <MaterialCategoriesEditor categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
      </Panel>
    </>
  );
}
