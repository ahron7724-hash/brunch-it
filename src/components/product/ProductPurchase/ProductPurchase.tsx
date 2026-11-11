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

/** Size, flavors (one or several) and note, with a live price, and "add to cart". */
export function ProductPurchase({ product, onAdded }: ProductPurchaseProps) {
  const [sizeId, setSizeId] = useState(product.sizes[0]?.id ?? "");
  const maxChoices = Math.max(1, product.maxOptionChoices);
  // One choice per group: the first is preselected. Several: the customer picks (at least one).
  const [optionsByGroup, setOptionsByGroup] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(product.optionGroups.map((g) => [g.name, maxChoices === 1 && g.options[0] ? [g.options[0].id] : []]))
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
    g.options.filter((o) => optionsByGroup[g.name]?.includes(o.id)).map((o) => ({ ...o, group: g.name }))
  );
  const unitPrice = (size?.price ?? 0) + selectedOptions.reduce((sum, o) => sum + o.extraPrice, 0);

  function handleAdd() {
    if (!size) return;
    const missing = product.optionGroups.find((g) => g.options.length > 0 && !optionsByGroup[g.name]?.length);
    if (missing) {
      setStatus({ ok: false, text: `נא לבחור ${missing.name}` });
      return;
    }
    const text = customTextSchema.safeParse(customText);
    if (!text.success) {
      setStatus({ ok: false, text: text.error.issues[0]?.message ?? "ההערה אינה תקינה" });
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
      // Several flavors of one group on one line: "טעם: שוקולד, וניל".
      optionLabels: product.optionGroups.flatMap((g) => {
        const labels = selectedOptions.filter((o) => o.group === g.name).map((o) => o.label);
        return labels.length > 0 ? [`${g.name}: ${labels.join(", ")}`] : [];
      }),
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
          selected={[sizeId]}
          onChange={([id]) => id && setSizeId(id)}
          choices={product.sizes.map((s) => ({ id: s.id, label: s.label, note: s.serves, price: { amount: s.price, kind: "full" } }))}
        />
      )}

      {product.optionGroups.map((group) => (
        <ChoiceGroup
          key={group.name}
          name={`option-${group.name}`}
          legend={group.name}
          selected={optionsByGroup[group.name] ?? []}
          max={maxChoices}
          onChange={(ids) => {
            setOptionsByGroup((prev) => ({ ...prev, [group.name]: ids }));
            setStatus(null);
          }}
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
