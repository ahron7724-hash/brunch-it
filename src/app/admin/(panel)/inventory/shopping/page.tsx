import { AdminHeader } from "@/components/admin/AdminHeader/AdminHeader";
import { Panel } from "@/components/admin/Panel/Panel";
import { PrintShare } from "@/components/admin/PrintShare/PrintShare";
import { RangeFilter } from "@/components/admin/RangeFilter/RangeFilter";
import { formatPickupDate } from "@/lib/format";
import { formatAmount, shoppingList } from "@/lib/inventory/calc";
import { listActiveOrderLines, listMaterials, listRecipes } from "@/lib/inventory/data";
import { parseRange } from "@/lib/inventory/range";

import styles from "../inventory.module.css";

type ShoppingPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ShoppingPage({ searchParams }: ShoppingPageProps) {
  const { from, to } = parseRange(await searchParams, 7);
  const [materials, recipes, lines] = await Promise.all([listMaterials(), listRecipes(), listActiveOrderLines(from, to)]);
  const list = shoppingList(lines, recipes, materials);
  const orderCount = new Set(lines.map((l) => l.orderId)).size;
  const range = `${formatPickupDate(from)} – ${formatPickupDate(to)}`;

  const text = [
    `רשימת קניות · ${range}`,
    ...list.measured.map((r) => `• ${r.material.name}: ${formatAmount(r.toBuy, r.material.unit)}`),
    ...(list.manual.length > 0 ? ["", "ירקות:", ...list.manual.map((m) => `• ${m.material.name} – ${m.uses.map((u) => `${u.label}: ${u.units}`).join(", ")}`)] : []),
  ].join("\n");

  return (
    <>
      <AdminHeader title="רשימת קניות" description={`${orderCount} הזמנות פעילות לאיסוף ${range}`} back={{ href: "/admin/inventory", label: "מלאי" }}>
        <PrintShare text={text} />
      </AdminHeader>

      <RangeFilter from={from} to={to} />

      <Panel
        title="חסר במלאי"
        description="רק מה שחסר. הזמנות מאושרות כבר ירדו מהמלאי, ולכן נספרות כאן רק הזמנות חדשות שעוד לא אושרו – כך שום דבר לא נספר פעמיים."
      >
        {list.measured.length === 0 ? (
          <p className={styles.muted}>אין חוסרים – יש במלאי את כל מה שצריך להזמנות בטווח הזה.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">חומר גלם</th>
                  <th scope="col">נדרש להזמנות חדשות</th>
                  <th scope="col">במלאי</th>
                  <th scope="col">לקנות</th>
                </tr>
              </thead>
              <tbody>
                {list.measured.map((r) => (
                  <tr key={r.material.id}>
                    <th scope="row">{r.material.name}</th>
                    <td className={styles.num}>{formatAmount(r.required, r.material.unit)}</td>
                    <td className={styles.num}>{formatAmount(r.material.currentStock, r.material.unit)}</td>
                    <td className={styles.num}>
                      <strong>{formatAmount(r.toBuy, r.material.unit)}</strong>
                      {r.toBuy > r.shortage && (
                        <span className={styles.note}>
                          {r.shortage > 0 ? `חסר ${formatAmount(r.shortage, r.material.unit)} + ` : ""}השלמה לסף ההתראה
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="ירקות (ידני)" description="בלי כמות – לאילו מוצרים וטעמים צריך כל ירק, וכמה יחידות מכל אחד. כל ההזמנות הפעילות בטווח נספרות.">
        {list.manual.length === 0 ? (
          <p className={styles.muted}>אין ירקות להזמנות בטווח הזה.</p>
        ) : (
          <ul role="list" className={styles.uses}>
            {list.manual.map(({ material, uses }) => (
              <li key={material.id}>
                <strong>{material.name}</strong>
                <ul role="list" className={styles.useList}>
                  {uses.map((u) => (
                    <li key={u.label}>
                      {u.label}: <span className={styles.num}>{u.units} יח׳</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
