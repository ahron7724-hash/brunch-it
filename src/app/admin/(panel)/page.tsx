import clsx from "clsx";
import Link from "next/link";
import { z } from "zod";

import { AdminHeader } from "@/components/admin/AdminHeader/AdminHeader";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect/OrderStatusSelect";
import { listOrders, ORDER_STATUSES, STATUS_LABELS, type AdminOrder, type OrderScope } from "@/lib/admin/orders";
import { formatPickupDate, formatPrice } from "@/lib/format";

import styles from "./orders.module.css";

const scopeSchema = z.enum(["upcoming", "past", "all"]).catch("upcoming");
const SCOPES: { value: OrderScope; label: string }[] = [
  { value: "upcoming", label: "קרובות" },
  { value: "past", label: "קודמות" },
  { value: "all", label: "הכל" },
];
const STATUS_OPTIONS = ORDER_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }));

type OrdersPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const scope = scopeSchema.parse((await searchParams).scope);
  const orders = await listOrders(scope);
  const byDate = groupByDate(orders);
  const newCount = orders.filter((o) => o.status === "new").length;

  return (
    <>
      <AdminHeader title="הזמנות" description={newCount > 0 ? `${newCount} הזמנות חדשות ממתינות לאישור` : "לפי תאריך איסוף"} />

      <nav aria-label="סינון הזמנות" className={styles.tabs}>
        {SCOPES.map((s) => (
          <Link
            key={s.value}
            href={s.value === "upcoming" ? "/admin" : `/admin?scope=${s.value}`}
            className={clsx(styles.tab, scope === s.value && styles.tabActive)}
            aria-current={scope === s.value ? "page" : undefined}
          >
            {s.label}
          </Link>
        ))}
      </nav>

      {orders.length === 0 && <p className={styles.empty}>אין הזמנות להצגה. הזמנות חדשות יופיעו כאן ברגע שיישלחו מהאתר.</p>}

      {[...byDate.entries()].map(([date, dayOrders]) => (
        <section key={date} className={styles.day} aria-labelledby={`day-${date}`}>
          <h2 id={`day-${date}`} className={styles.dayTitle}>
            {formatPickupDate(date)}
            <span className={styles.dayCount}>{dayOrders.length} הזמנות</span>
          </h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">מס׳</th>
                  <th scope="col">שעה</th>
                  <th scope="col">לקוח</th>
                  <th scope="col">קבלה</th>
                  <th scope="col">סכום</th>
                  <th scope="col">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {dayOrders.map((order) => (
                  <tr key={order.id} className={clsx(order.status === "new" && styles.rowNew)}>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className={styles.orderLink}>
                        #{order.order_number}
                      </Link>
                    </td>
                    <td className="ltr">
                      {order.slot_start}–{order.slot_end}
                    </td>
                    <td>
                      {order.customer_name}
                      <span className={clsx("ltr", styles.phone)}>{order.customer_phone}</span>
                    </td>
                    <td>{order.fulfillment === "pickup" ? "איסוף" : `משלוח · ${order.delivery_zone_name ?? ""}`}</td>
                    <td className={styles.num}>{formatPrice(order.total)}</td>
                    <td>
                      <OrderStatusSelect orderId={order.id} status={order.status} options={STATUS_OPTIONS} label={`סטטוס הזמנה ${order.order_number}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}

function groupByDate(orders: AdminOrder[]): Map<string, AdminOrder[]> {
  const groups = new Map<string, AdminOrder[]>();
  for (const order of orders) groups.set(order.pickup_date, [...(groups.get(order.pickup_date) ?? []), order]);
  return groups;
}
