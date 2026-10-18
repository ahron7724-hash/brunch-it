import { notFound } from "next/navigation";

import { AdminHeader } from "@/components/admin/AdminHeader/AdminHeader";
import { OrderActions } from "@/components/admin/OrderActions/OrderActions";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect/OrderStatusSelect";
import { Panel } from "@/components/admin/Panel/Panel";
import { getOrder, ORDER_STATUSES, STATUS_LABELS } from "@/lib/admin/orders";
import { formatPickupDate, formatPrice } from "@/lib/format";
import { mailtoHref, telHref } from "@/lib/security/safeHref";

import styles from "./order.module.css";

type OrderPageProps = { params: Promise<{ id: string }> };

export default async function OrderPage({ params }: OrderPageProps) {
  const data = await getOrder((await params).id);
  if (!data) notFound();
  const { order, items } = data;
  const phone = telHref(order.customer_phone);
  const email = mailtoHref(order.customer_email);
  const created = new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Jerusalem" }).format(new Date(order.created_at));

  return (
    <>
      <AdminHeader title={`הזמנה #${order.order_number}`} description={`התקבלה ${created}`} back={{ href: "/admin", label: "כל ההזמנות" }}>
        <OrderStatusSelect orderId={order.id} status={order.status} options={ORDER_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))} label="סטטוס ההזמנה" />
      </AdminHeader>

      <Panel title={order.fulfillment === "pickup" ? "איסוף עצמי" : "משלוח"}>
        <p className={styles.big}>
          {formatPickupDate(order.pickup_date)} · <bdi dir="ltr">{order.slot_start}–{order.slot_end}</bdi>
        </p>
        {order.fulfillment === "delivery" && (
          <p>
            {order.delivery_address} ({order.delivery_zone_name})
          </p>
        )}
      </Panel>

      <Panel title="לקוח">
        <p className={styles.big}>{order.customer_name}</p>
        <p>{phone ? <a href={phone} className="ltr">{order.customer_phone}</a> : order.customer_phone}</p>
        <p>{email ? <a href={email} className="ltr">{order.customer_email}</a> : order.customer_email}</p>
        {order.notes && <p className={styles.notes}>הערות: {order.notes}</p>}
      </Panel>

      <Panel title="פריטים">
        <ul role="list" className={styles.items}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              <div>
                <p className={styles.itemTitle}>
                  {item.quantity} × {item.product_title} – {item.size_label}
                </p>
                {item.options.length > 0 && <p className={styles.meta}>{item.options.map((o) => `${o.group}: ${o.label}`).join(" · ")}</p>}
                {item.custom_text && <p className={styles.inscription}>כיתוב: {item.custom_text}</p>}
              </div>
              <span className={styles.num}>{formatPrice(item.line_total)}</span>
            </li>
          ))}
        </ul>
        <dl className={styles.totals}>
          {order.delivery_fee > 0 && (
            <div>
              <dt>משלוח</dt>
              <dd>{formatPrice(order.delivery_fee)}</dd>
            </div>
          )}
          <div className={styles.total}>
            <dt>סה״כ</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </Panel>

      <OrderActions orderId={order.id} />
    </>
  );
}
