import Link from "next/link";

import { AdminHeader } from "@/components/admin/AdminHeader/AdminHeader";
import { formatAmount } from "@/lib/inventory/calc";
import { listMovements, REASON_LABELS } from "@/lib/inventory/data";

import styles from "../../orders.module.css";

const dateTime = new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Jerusalem" });

export default async function StockHistoryPage() {
  const movements = await listMovements();

  return (
    <>
      <AdminHeader title="יומן תנועות מלאי" description="300 התנועות האחרונות" back={{ href: "/admin/inventory", label: "מלאי" }} />

      {movements.length === 0 ? (
        <p className={styles.empty}>עדיין אין תנועות. הן יופיעו כאן אחרי קנייה, ספירה, שימוש או אישור הזמנה.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">מתי</th>
                <th scope="col">חומר גלם</th>
                <th scope="col">שינוי</th>
                <th scope="col">סיבה</th>
                <th scope="col">הערה</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className={styles.num}>{dateTime.format(new Date(m.created_at))}</td>
                  <td>{m.raw_materials.name}</td>
                  <td className={styles.num}>
                    {m.change > 0 ? "+" : "−"}
                    {formatAmount(Math.abs(m.change), m.raw_materials.unit)}
                  </td>
                  <td>
                    {REASON_LABELS[m.reason]}
                    {m.orders && (
                      <>
                        {" "}
                        <Link href={`/admin/orders/${m.orders.id}`} className={styles.orderLink}>
                          #{m.orders.order_number}
                        </Link>
                      </>
                    )}
                  </td>
                  <td>{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
