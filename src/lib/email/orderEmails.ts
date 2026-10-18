import "server-only";

import { render as renderEmail } from "@react-email/render";
import { createElement } from "react";

import { formatPickupDate, formatPrice } from "@/lib/format";
import type { SiteSettings } from "@/lib/settings/defaults";

import { OrderEmail } from "./OrderEmail";
import { sendEmail } from "./send";
import type { OrderSummary } from "./types";

/** Sends the owner notification and the customer confirmation. Failures are logged, never thrown. */
export async function sendOrderEmails(order: OrderSummary, settings: SiteSettings) {
  const ownerAddress = settings.orderEmail || process.env.GMAIL_USER || "";
  const text = plainText(order);

  const [ownerHtml, customerHtml] = await Promise.all([render("owner", order, settings), render("customer", order, settings)]);

  const results = await Promise.all([
    ownerAddress
      ? sendEmail({
          to: ownerAddress,
          replyTo: order.customerEmail,
          subject: `הזמנה חדשה #${order.orderNumber} – ${formatPickupDate(order.pickupDate)}`,
          html: ownerHtml,
          text,
        })
      : Promise.resolve({ ok: false as const, reason: "no-owner-address" }),
    sendEmail({
      to: order.customerEmail,
      replyTo: ownerAddress || undefined,
      subject: `${settings.businessName}: קיבלנו את הזמנה מספר ${order.orderNumber}`,
      html: customerHtml,
      text,
    }),
  ]);

  for (const result of results) {
    if (!result.ok) console.warn("order email not sent", order.orderNumber, result.reason);
  }
}

function render(audience: "owner" | "customer", order: OrderSummary, settings: SiteSettings): Promise<string> {
  return renderEmail(createElement(OrderEmail, { audience, order, settings }));
}

function plainText(order: OrderSummary): string {
  const lines = order.lines.map((l) => `${l.quantity} × ${l.title} (${l.sizeLabel}) – ${formatPrice(l.lineTotal)}`);
  return [
    `הזמנה מספר ${order.orderNumber}`,
    `${order.fulfillment === "pickup" ? "איסוף" : "משלוח"}: ${formatPickupDate(order.pickupDate)} ${order.slotStart}–${order.slotEnd}`,
    ...lines,
    `סה״כ: ${formatPrice(order.total)}`,
  ].join("\n");
}
