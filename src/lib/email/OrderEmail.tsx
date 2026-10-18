import type { SiteSettings } from "@/lib/settings/defaults";
import { formatPickupDate, formatPrice } from "@/lib/format";

import type { OrderSummary } from "./types";

// Email clients ignore external CSS, so the template carries one small embedded stylesheet.
// All dynamic values are rendered as JSX text, so customer input is always escaped.
const CSS = `
  body { margin: 0; padding: 24px 12px; background: #f7f5f2; font-family: Arial, Helvetica, sans-serif; color: #1e1c1a; }
  .card { max-width: 560px; margin: 0 auto; padding: 32px 28px; background: #ffffff; }
  .brand { font-size: 22px; font-weight: 300; margin: 0 0 4px; }
  .eyebrow { font-size: 13px; color: #8a6f4a; margin: 0 0 24px; }
  h1 { font-size: 20px; font-weight: 400; margin: 0 0 16px; }
  p { font-size: 15px; line-height: 1.6; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  td { padding: 10px 0; border-bottom: 1px solid #ebe7e1; font-size: 14px; vertical-align: top; }
  .num { text-align: left; white-space: nowrap; }
  .muted { color: #6f6a64; font-size: 13px; }
  .total td { border-bottom: 0; font-size: 16px; font-weight: bold; }
  .box { background: #f7f5f2; padding: 14px 16px; margin: 16px 0; }
`;

type OrderEmailProps = {
  audience: "owner" | "customer";
  order: OrderSummary;
  settings: SiteSettings;
};

export function OrderEmail({ audience, order, settings }: OrderEmailProps) {
  const isOwner = audience === "owner";
  return (
    <html lang="he" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <style>{CSS}</style>
      </head>
      <body>
        <div className="card">
          <p className="brand">{settings.businessName}</p>
          <p className="eyebrow">הזמנה מספר {order.orderNumber}</p>
          <h1>{isOwner ? "התקבלה הזמנה חדשה" : `תודה, ${order.customerName}! קיבלנו את ההזמנה`}</h1>
          {!isOwner && <p>נעבור על ההזמנה ונאשר אותה מולכם בהקדם. אין צורך לשלם באתר.</p>}

          <div className="box">
            <p>
              <b>{order.fulfillment === "pickup" ? "איסוף עצמי" : "משלוח"}:</b> {formatPickupDate(order.pickupDate)},{" "}
              {order.slotStart}–{order.slotEnd}
            </p>
            {order.fulfillment === "pickup" && settings.pickupAddress && <p>כתובת לאיסוף: {settings.pickupAddress}</p>}
            {order.fulfillment === "delivery" && (
              <p>
                כתובת למשלוח: {order.deliveryAddress} ({order.deliveryZoneName})
              </p>
            )}
          </div>

          <table role="presentation">
            <tbody>
              {order.lines.map((line) => (
                <tr key={`${line.productId}-${line.sizeLabel}-${line.customText ?? ""}-${line.options.map((o) => o.label).join("|")}`}>
                  <td>
                    {line.quantity} × {line.title} – {line.sizeLabel}
                    {line.options.length > 0 && (
                      <div className="muted">{line.options.map((o) => `${o.group}: ${o.label}`).join(" · ")}</div>
                    )}
                    {line.customText && <div className="muted">כיתוב: {line.customText}</div>}
                  </td>
                  <td className="num">{formatPrice(line.lineTotal)}</td>
                </tr>
              ))}
              {order.deliveryFee > 0 && (
                <tr>
                  <td>משלוח</td>
                  <td className="num">{formatPrice(order.deliveryFee)}</td>
                </tr>
              )}
              <tr className="total">
                <td>סה״כ</td>
                <td className="num">{formatPrice(order.total)}</td>
              </tr>
            </tbody>
          </table>

          {isOwner && (
            <div className="box">
              <p>
                <b>{order.customerName}</b>
              </p>
              <p dir="ltr">{order.customerPhone}</p>
              <p dir="ltr">{order.customerEmail}</p>
              {order.notes && <p>הערות: {order.notes}</p>}
            </div>
          )}
          {!isOwner && order.notes && <p className="muted">הערות שכתבתם: {order.notes}</p>}
          {!isOwner && settings.phone && <p className="muted">לשאלות: {settings.phone}</p>}
        </div>
      </body>
    </html>
  );
}
