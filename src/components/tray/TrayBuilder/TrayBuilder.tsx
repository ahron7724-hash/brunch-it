"use client";

import clsx from "clsx";
import { Minus, Plus } from "lucide-react";
import Image from "next/image";
import { useState, type DragEvent } from "react";

import { ChoiceGroup } from "@/components/product/ProductPurchase/ChoiceGroup";
import { Button } from "@/components/ui/Button/Button";
import { useAvailability } from "@/hooks/useAvailability";
import { TRAY_MAX_SINGLES, type Tray, type TrayItem } from "@/lib/data/types";
import { formatPrice } from "@/lib/format";
import { formatLeadTime } from "@/lib/leadTime";
import { useBooking } from "@/stores/booking";
import { useCart } from "@/stores/cart";

import styles from "./TrayBuilder.module.css";

type TrayBuilderProps = { tray: Tray };

// Drag payloads: an item from the list going in, or a filled slot going out.
const ADD = "tray-add:";
const REMOVE = "tray-remove:";

/** Pick a tray size, then fill it: drag items onto the tray, or tap + (phones). */
export function TrayBuilder({ tray }: TrayBuilderProps) {
  const [sizeId, setSizeId] = useState(tray.sizes[0]?.id ?? "");
  /** Item ids in the order they were placed. */
  const [contents, setContents] = useState<string[]>([]);
  const [dropTarget, setDropTarget] = useState<"tray" | "items" | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const addToCart = useCart((s) => s.add);
  const setPendingItem = useCart((s) => s.setPendingItem);
  const openCart = useCart((s) => s.open);
  const hasPickup = useBooking((s) => s.pickupDate !== null);
  const openPicker = useBooking((s) => s.openPicker);
  const availability = useAvailability(tray.leadTimeHours);

  const size = tray.sizes.find((s) => s.id === sizeId);
  const capacity = size?.capacity ?? null;
  const limit = capacity ?? TRAY_MAX_SINGLES;
  const isFull = contents.length >= limit;
  const isReady = capacity === null ? contents.length > 0 : contents.length === capacity;
  const itemsById = new Map(tray.items.map((i) => [i.id, i]));
  const total = contents.reduce((sum, id) => sum + (itemsById.get(id)?.price ?? 0), 0);
  const countOf = (id: string) => contents.filter((c) => c === id).length;
  // A fixed tray shows all its slots; singles show what's in it plus one open slot.
  const slotCount = capacity ?? Math.min(TRAY_MAX_SINGLES, contents.length + 1);

  function add(id: string) {
    if (isFull) {
      setStatus({ ok: false, text: "המגש מלא. אפשר להוציא פריט כדי להחליף." });
      return;
    }
    setContents((prev) => [...prev, id]);
    setStatus(null);
  }

  function removeAt(index: number) {
    setContents((prev) => prev.filter((_, i) => i !== index));
    setStatus(null);
  }

  function removeOne(id: string) {
    const index = contents.lastIndexOf(id);
    if (index !== -1) removeAt(index);
  }

  function changeSize(id: string) {
    const next = tray.sizes.find((s) => s.id === id);
    setSizeId(id);
    // A smaller tray keeps the first items that fit.
    if (next?.capacity) setContents((prev) => prev.slice(0, next.capacity ?? undefined));
    setStatus(null);
  }

  function handleDrop(event: DragEvent, target: "tray" | "items") {
    event.preventDefault();
    setDropTarget(null);
    const data = event.dataTransfer.getData("text/plain");
    if (target === "tray" && data.startsWith(ADD)) {
      const id = data.slice(ADD.length);
      if (itemsById.has(id)) add(id);
    } else if (target === "items" && data.startsWith(REMOVE)) {
      const index = Number(data.slice(REMOVE.length));
      if (Number.isInteger(index)) removeAt(index);
    }
  }

  function allowDrop(event: DragEvent, target: "tray" | "items") {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dropTarget !== target) setDropTarget(target);
  }

  function handleAdd() {
    if (!size || !isReady) return;
    const counts = [...new Set(contents)].sort().map((id) => ({ id, quantity: countOf(id) }));
    const item = {
      key: JSON.stringify(["tray", tray.id, size.id, counts]),
      kind: "tray" as const,
      productId: tray.id,
      slug: tray.slug,
      sizeId: size.id,
      title: tray.title,
      sizeLabel: size.label,
      unitPrice: total,
      quantity: 1,
      imageUrl: tray.imageUrl ?? tray.items.find((i) => i.imageUrl)?.imageUrl ?? null,
      trayItems: counts,
      optionLabels: counts.map((c) => `${itemsById.get(c.id)?.name ?? ""} × ${c.quantity}`),
      leadTimeHours: tray.leadTimeHours,
    };
    setContents([]);
    // First add-to-cart: the pickup slot must be chosen before the item goes in the cart.
    if (!hasPickup) {
      setPendingItem(item);
      setStatus(null);
      openPicker();
      return;
    }
    addToCart(item);
    setStatus({ ok: true, text: "המגש נוסף לסל" });
    openCart();
  }

  const counter = capacity === null ? `${contents.length} יחידות` : `${contents.length} מתוך ${capacity}`;
  const unavailable = availability.status === "unavailable";

  const action = (
    <div className={styles.action}>
      <p className={styles.summary}>
        <span className={styles.counter}>{counter}</span>
        <span className={styles.total}>{formatPrice(total)}</span>
      </p>
      {unavailable ? (
        <Button disabled className={styles.addButton}>
          לא זמין לתאריך שנבחר
        </Button>
      ) : (
        <Button onClick={handleAdd} disabled={!isReady} className={styles.addButton}>
          {isReady ? "הוספה לסל" : capacity === null ? "בחרו פריטים" : `נשארו עוד ${capacity - contents.length}`}
        </Button>
      )}
    </div>
  );

  return (
    <div className={styles.builder}>
      {tray.sizes.length > 1 && (
        <ChoiceGroup
          name="tray-size"
          legend="גודל המגש"
          value={sizeId}
          onChange={changeSize}
          choices={tray.sizes.map((s) => ({ id: s.id, label: s.label, note: s.capacity ? `${s.capacity} יחידות` : "כמה שרוצים" }))}
        />
      )}

      <div className={styles.board}>
        <section
          aria-labelledby="tray-items-title"
          className={clsx(styles.items, dropTarget === "items" && styles.dropActive)}
          onDragOver={(e) => allowDrop(e, "items")}
          onDragLeave={() => setDropTarget(null)}
          onDrop={(e) => handleDrop(e, "items")}
        >
          <h2 id="tray-items-title" className={styles.heading}>
            מה נכניס למגש?
          </h2>
          <p className={styles.hint}>גוררים למגש, או לוחצים על +</p>
          <ul role="list" className={styles.itemGrid}>
            {tray.items.map((item) => (
              <ItemCard key={item.id} item={item} count={countOf(item.id)} canAdd={!isFull} onAdd={() => add(item.id)} onRemove={() => removeOne(item.id)} />
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="tray-title"
          className={clsx(styles.tray, dropTarget === "tray" && styles.dropActive)}
          onDragOver={(e) => allowDrop(e, "tray")}
          onDragLeave={() => setDropTarget(null)}
          onDrop={(e) => handleDrop(e, "tray")}
        >
          <div className={styles.trayHead}>
            <h2 id="tray-title" className={styles.heading}>
              המגש שלך
            </h2>
            {contents.length > 0 && (
              <button type="button" className={styles.clear} onClick={() => setContents([])}>
                ריקון
              </button>
            )}
          </div>

          <ol className={styles.slots} aria-label={counter}>
            {Array.from({ length: slotCount }, (_, index) => {
              const item = itemsById.get(contents[index] ?? "");
              return (
                <li key={index} className={styles.slot}>
                  {item ? (
                    <button
                      key={`${index}-${item.id}`}
                      type="button"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", `${REMOVE}${index}`)}
                      onClick={() => removeAt(index)}
                      className={styles.filled}
                      aria-label={`הוצאת ${item.name} מהמגש`}
                      title={item.name}
                    >
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt="" fill sizes="5rem" className={styles.slotImage} />
                      ) : (
                        <span className={styles.initial}>{item.name.slice(0, 1)}</span>
                      )}
                    </button>
                  ) : (
                    <span className={styles.empty} aria-hidden="true" />
                  )}
                </li>
              );
            })}
          </ol>

          {contents.length === 0 && <p className={styles.hint}>המגש ריק. גררו לכאן פריטים.</p>}
          {contents.length > 0 && <p className={styles.hint}>לחיצה על פריט במגש מוציאה אותו.</p>}

          <div className={styles.trayAction}>{action}</div>
        </section>
      </div>

      {unavailable && (
        <p className={styles.unavailableText}>
          המגש דורש לפחות {formatLeadTime(availability.leadTimeHours)} הכנה.{" "}
          <button type="button" onClick={openPicker} className={styles.inlineLink}>
            בחירת מועד מאוחר יותר
          </button>
        </p>
      )}

      {status && (
        <p role="status" className={status.ok ? styles.success : styles.error}>
          {status.text}
        </p>
      )}

      {/* Phones: the tray is below the list, so the count and the button stay in view. */}
      <div className={styles.mobileBar}>{action}</div>
    </div>
  );
}

type ItemCardProps = {
  item: TrayItem;
  count: number;
  canAdd: boolean;
  onAdd: () => void;
  onRemove: () => void;
};

function ItemCard({ item, count, canAdd, onAdd, onRemove }: ItemCardProps) {
  return (
    <li
      className={clsx(styles.item, count > 0 && styles.itemChosen)}
      draggable={canAdd}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", `${ADD}${item.id}`);
        e.dataTransfer.effectAllowed = "move";
      }}
    >
      <span className={styles.itemImageWrap}>
        {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="(min-width: 56em) 12rem, 45vw" className={styles.itemImage} draggable={false} />}
        {count > 0 && <span className={styles.badge}>{count}</span>}
      </span>
      <span className={styles.itemName}>{item.name}</span>
      <span className={styles.itemPrice}>{formatPrice(item.price)} ליחידה</span>
      <span className={styles.itemControls}>
        <button type="button" onClick={onRemove} disabled={count === 0} className={styles.stepButton} aria-label={`הוצאת ${item.name}`}>
          <Minus size={16} strokeWidth={1.25} aria-hidden="true" />
        </button>
        <output className={styles.stepValue} aria-label={`${item.name} במגש`}>
          {count}
        </output>
        <button type="button" onClick={onAdd} disabled={!canAdd} className={styles.stepButton} aria-label={`הוספת ${item.name}`}>
          <Plus size={16} strokeWidth={1.25} aria-hidden="true" />
        </button>
      </span>
    </li>
  );
}
