"use client";

import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/Button/Button";
import { useAvailability } from "@/hooks/useAvailability";
import type { ProductDetail } from "@/lib/data/types";
import { formatPrice } from "@/lib/format";
import { formatLeadTime } from "@/lib/leadTime";
import { useBooking } from "@/stores/booking";
import { useCart } from "@/stores/cart";

import { ChoiceGroup } from "./ChoiceGroup";
import { CustomTextField } from "./CustomTextField";
import styles from "./ProductPurchase.module.css";
import { QuantityStepper } from "./QuantityStepper";

const CUSTOM_TEXT_MAX = 200;
const customTextSchema = z.string().trim().max(CUSTOM_TEXT_MAX, `עד ${CUSTOM_TEXT_MAX} תווים`);

type ProductPurchaseProps = {
  product: ProductDetail;
  /** Called after the item is added (or handed to the pickup picker), e.g. to close a quick-view window. */
  onAdded?: () => void;
};

/** Size, flavor and custom-text selection with a live price, and "add to cart". */
export function ProductPurchase({ product, onAdded }: ProductPurchaseProps) {
  const [sizeId, setSizeId] = useState(product.sizes[0]?.id ?? "");
  const [optionByGroup, setOptionByGroup] = useState<Record<string, string>>(() =>
    Object.fromEntries(product.optionGroups.flatMap((g) => (g.options[0] ? [[g.name, g.options[0].id]] : [])))
  );
  const [customText, setCustomText] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const addToCart = useCart((s) => s.add);
  const setPendingItem = useCart((s) => s.setPendingItem);
  const openCart = useCart((s) => s.open);
  const hasPickup = useBooking((s) => s.pickupDate !== null);
  const openPicker = useBooking((s) => s.openPicker);
  const availability = useAvailability(product.leadTimeHours);
  const unavailable = availability.status === "unavailable";

  const size = product.sizes.find((s) => s.id === sizeId);
  const selectedOptions = product.optionGroups.flatMap((g) =>
    g.options.filter((o) => o.id === optionByGroup[g.name]).map((o) => ({ ...o, group: g.name }))
  );
  const unitPrice = (size?.price ?? 0) + selectedOptions.reduce((sum, o) => sum + o.extraPrice, 0);

  function handleAdd() {
    if (!size) return;
    const text = customTextSchema.safeParse(customText);
    if (!text.success) {
      setStatus({ ok: false, text: text.error.issues[0]?.message ?? "הכיתוב אינו תקין" });
      return;
    }
    const optionIds = selectedOptions.map((o) => o.id).sort();
    const item = {
      key: JSON.stringify([product.id, size.id, optionIds, text.data]),
      productId: product.id,
      slug: product.slug,
      sizeId: size.id,
      title: product.title,
      sizeLabel: size.label,
      unitPrice,
      quantity,
      imageUrl: product.image?.url ?? null,
      customText: text.data || undefined,
      optionIds,
      optionLabels: selectedOptions.map((o) => `${o.group}: ${o.label}`),
      leadTimeHours: product.leadTimeHours,
    };
    // First add-to-cart: the pickup slot must be chosen before the item goes in the cart.
    if (!hasPickup) {
      setPendingItem(item);
      setStatus(null);
      onAdded?.();
      openPicker();
      return;
    }
    addToCart(item);
    setStatus({ ok: true, text: "נוסף לסל" });
    onAdded?.();
    openCart();
  }

  return (
    <div className={styles.purchase}>
      {product.sizes.length > 1 && (
        <ChoiceGroup
          name="size"
          legend="גודל"
          value={sizeId}
          onChange={setSizeId}
          choices={product.sizes.map((s) => ({ id: s.id, label: s.label, note: s.serves, price: { amount: s.price, kind: "full" } }))}
        />
      )}

      {product.optionGroups.map((group) => (
        <ChoiceGroup
          key={group.name}
          name={`option-${group.name}`}
          legend={group.name}
          value={optionByGroup[group.name] ?? ""}
          onChange={(id) => setOptionByGroup((prev) => ({ ...prev, [group.name]: id }))}
          choices={group.options.map((o) => ({ id: o.id, label: o.label, price: { amount: o.extraPrice, kind: "extra" } }))}
        />
      ))}

      {product.allowsCustomText && (
        <CustomTextField label={product.customTextLabel} value={customText} onChange={setCustomText} max={CUSTOM_TEXT_MAX} />
      )}

      <div className={styles.buyRow}>
        <QuantityStepper value={quantity} onChange={setQuantity} />
        <p className={styles.total}>{formatPrice(unitPrice * quantity)}</p>
      </div>

      {unavailable ? (
        <div className={styles.unavailable}>
          <Button disabled className={styles.addButton}>
            לא זמין לתאריך שנבחר
          </Button>
          <p className={styles.unavailableText}>
            המוצר דורש לפחות {formatLeadTime(availability.leadTimeHours)} הכנה.{" "}
            <button type="button" onClick={openPicker} className={styles.inlineLink}>
              בחירת מועד מאוחר יותר
            </button>
          </p>
        </div>
      ) : (
        <Button onClick={handleAdd} disabled={!size} className={styles.addButton}>
          הוספה לסל
        </Button>
      )}

      {status && (
        <p role="status" className={status.ok ? styles.success : styles.error}>
          {status.text}
        </p>
      )}
    </div>
  );
}
