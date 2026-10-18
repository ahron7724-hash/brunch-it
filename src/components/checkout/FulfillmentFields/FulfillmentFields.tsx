"use client";

import clsx from "clsx";

import { Field } from "@/components/ui/Field/Field";
import type { DeliveryZone } from "@/lib/data/delivery";
import { formatPrice } from "@/lib/format";
import { safeHref } from "@/lib/security/safeHref";

import styles from "./FulfillmentFields.module.css";

type FulfillmentFieldsProps = {
  value: "pickup" | "delivery";
  onChange: (value: "pickup" | "delivery") => void;
  zones: DeliveryZone[];
  zoneId: string;
  onZoneChange: (id: string) => void;
  pickupAddress: string;
  pickupMapUrl: string;
  errors: { deliveryZoneId?: string; deliveryAddress?: string };
  addressDefault?: string;
};

export function FulfillmentFields(props: FulfillmentFieldsProps) {
  const { value, onChange, zones, zoneId, onZoneChange, pickupAddress, pickupMapUrl, errors, addressDefault } = props;
  const mapHref = safeHref(pickupMapUrl);

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>אופן הקבלה</legend>
      <div className={styles.options}>
        <label className={clsx(styles.option, value === "pickup" && styles.optionActive)}>
          <input type="radio" name="fulfillment" value="pickup" checked={value === "pickup"} onChange={() => onChange("pickup")} className="visually-hidden" />
          <span className={styles.optionTitle}>איסוף עצמי</span>
          <span className={styles.optionNote}>ללא עלות</span>
        </label>
        {zones.length > 0 && (
          <label className={clsx(styles.option, value === "delivery" && styles.optionActive)}>
            <input type="radio" name="fulfillment" value="delivery" checked={value === "delivery"} onChange={() => onChange("delivery")} className="visually-hidden" />
            <span className={styles.optionTitle}>משלוח</span>
            <span className={styles.optionNote}>לפי אזור</span>
          </label>
        )}
      </div>

      {value === "pickup" && pickupAddress && (
        <p className={styles.address}>
          כתובת לאיסוף: {pickupAddress}
          {mapHref && (
            <>
              {" · "}
              <a href={mapHref} target="_blank" rel="noopener noreferrer" className={styles.mapLink}>
                פתיחה במפה
              </a>
            </>
          )}
        </p>
      )}

      {value === "delivery" && (
        <div className={styles.delivery}>
          <div className={styles.selectField}>
            <label htmlFor="deliveryZoneId" className={styles.label}>
              אזור משלוח
            </label>
            <select
              id="deliveryZoneId"
              name="deliveryZoneId"
              value={zoneId}
              onChange={(e) => onZoneChange(e.target.value)}
              className={styles.select}
              aria-invalid={Boolean(errors.deliveryZoneId)}
              aria-describedby={errors.deliveryZoneId ? "deliveryZoneId-error" : undefined}
              required
            >
              <option value="">בחירת אזור</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name} – {formatPrice(zone.price)}
                  {zone.minOrder > 0 ? ` (מינימום ${formatPrice(zone.minOrder)})` : ""}
                </option>
              ))}
            </select>
            {errors.deliveryZoneId && (
              <p id="deliveryZoneId-error" role="alert" className={styles.error}>
                {errors.deliveryZoneId}
              </p>
            )}
          </div>
          <Field id="deliveryAddress" label="כתובת למשלוח" maxLength={300} error={errors.deliveryAddress} autoComplete="street-address" defaultValue={addressDefault} />
        </div>
      )}
    </fieldset>
  );
}
