"use client";

import clsx from "clsx";
import { useActionState, useState } from "react";

import { placeOrder } from "@/app/(site)/checkout/actions";
import { Field } from "@/components/ui/Field/Field";
import { FulfillmentFields } from "@/components/checkout/FulfillmentFields/FulfillmentFields";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation/OrderConfirmation";
import { OrderSummary } from "@/components/checkout/OrderSummary/OrderSummary";
import { Button, ButtonLink } from "@/components/ui/Button/Button";
import { useHydrated } from "@/hooks/useHydrated";
import type { DeliveryZone } from "@/lib/data/delivery";
import type { CheckoutState } from "@/lib/validation/order";
import { useBooking } from "@/stores/booking";
import { useCart } from "@/stores/cart";

import styles from "./CheckoutForm.module.css";

type CheckoutFormProps = { zones: DeliveryZone[]; pickupAddress: string; pickupMapUrl: string };

const initialState: CheckoutState = { ok: false };

export function CheckoutForm({ zones, pickupAddress, pickupMapUrl }: CheckoutFormProps) {
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const pickupDate = useBooking((s) => s.pickupDate);
  const pickupSlot = useBooking((s) => s.pickupSlot);
  const openPicker = useBooking((s) => s.openPicker);
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [zoneId, setZoneId] = useState("");
  const clearCart = useCart((s) => s.clear);
  const [state, formAction, isPending] = useActionState(async (prev: CheckoutState, formData: FormData) => {
    const result = await placeOrder(prev, formData);
    if (result.ok) clearCart();
    return result;
  }, initialState);

  if (!hydrated) return null;
  if (state.ok && state.orderNumber) return <OrderConfirmation orderNumber={state.orderNumber} />;

  if (items.length === 0) {
    return (
      <div className={clsx("container", styles.empty)}>
        <p>הסל ריק.</p>
        <ButtonLink href="/catalog" variant="line">
          לקטלוג
        </ButtonLink>
      </div>
    );
  }

  const deliveryFee = fulfillment === "delivery" ? (zones.find((z) => z.id === zoneId)?.price ?? 0) : 0;
  const cart = JSON.stringify(
    items.map((i) => ({ productId: i.productId, sizeId: i.sizeId, optionIds: i.optionIds ?? [], quantity: i.quantity, customText: i.customText }))
  );
  const errors = state.errors ?? {};
  const values = state.values ?? {};

  return (
    <div className={clsx("container", styles.layout)}>
      <form action={formAction} noValidate className={styles.form}>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>פרטי המזמין</legend>
          <div className={styles.row}>
            <Field id="customerName" label="שם מלא" maxLength={80} error={errors.customerName} autoComplete="name" defaultValue={values.customerName} />
            <Field id="customerPhone" label="טלפון" type="tel" dir="ltr" maxLength={20} error={errors.customerPhone} autoComplete="tel" defaultValue={values.customerPhone} />
          </div>
          <Field id="customerEmail" label="דוא״ל" type="email" dir="ltr" maxLength={254} error={errors.customerEmail} autoComplete="email" defaultValue={values.customerEmail} />
          <Field id="notes" label="הערות להזמנה" multiline required={false} maxLength={1000} error={errors.notes} defaultValue={values.notes} />
        </fieldset>

        <FulfillmentFields
          value={fulfillment}
          onChange={setFulfillment}
          zones={zones}
          zoneId={zoneId}
          onZoneChange={setZoneId}
          pickupAddress={pickupAddress}
          pickupMapUrl={pickupMapUrl}
          errors={errors}
          addressDefault={values.deliveryAddress}
        />

        <input type="hidden" name="cart" value={cart} />
        <input type="hidden" name="pickupDate" value={pickupDate ?? ""} />
        <input type="hidden" name="slotStart" value={pickupSlot?.start ?? ""} />
        <input type="hidden" name="slotEnd" value={pickupSlot?.end ?? ""} />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className={styles.honeypot} aria-hidden="true" />

        {state.message && (
          <p role="alert" className={styles.error}>
            {state.message}
          </p>
        )}

        {pickupDate ? (
          <Button type="submit" disabled={isPending} className={styles.submit}>
            {isPending ? "שולחים…" : "אישור ושליחת ההזמנה"}
          </Button>
        ) : (
          <Button onClick={openPicker} className={styles.submit}>
            בחירת מועד איסוף
          </Button>
        )}
      </form>

      <OrderSummary
        items={items}
        pickupDate={pickupDate}
        pickupSlot={pickupSlot}
        fulfillmentLabel={fulfillment === "pickup" ? "איסוף" : "משלוח"}
        deliveryFee={deliveryFee}
        onChangePickup={openPicker}
      />
    </div>
  );
}
