"use client";

import clsx from "clsx";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import Image from "next/image";

import { ImageUploader } from "@/components/admin/ImageUploader/ImageUploader";

import styles from "./TrayEditor.module.css";

export type TrayItemValue = { _key: string; id?: string; name: string; price: string; imageUrl: string; isActive: boolean };

type TrayItemsFieldProps = {
  items: TrayItemValue[];
  onChange: (items: TrayItemValue[]) => void;
};

const MAX = 60;

/** The items a customer can put in the tray: image, name, unit price, shown or hidden. */
export function TrayItemsField({ items, onChange }: TrayItemsFieldProps) {
  const update = (key: string, patch: Partial<TrayItemValue>) => onChange(items.map((i) => (i._key === key ? { ...i, ...patch } : i)));
  const move = (index: number, delta: number) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    if (item) next.splice(index + delta, 0, item);
    onChange(next);
  };

  return (
    <div className={styles.itemsField}>
      {items.length === 0 && <p className={styles.empty}>עדיין אין פריטים. הוסיפו למשל: עוגיית שוקולד צ׳יפס, סופגניית ריבה…</p>}
      <ul role="list" className={styles.itemList}>
        {items.map((item, index) => (
          <li key={item._key} className={clsx(styles.itemRow, !item.isActive && styles.itemHidden)}>
            <div className={styles.thumb}>
              {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="5rem" className={styles.thumbImage} />}
            </div>
            <div className={styles.itemFields}>
              <label className={styles.cell}>
                <span className={styles.cellLabel}>שם הפריט</span>
                <input value={item.name} maxLength={80} onChange={(e) => update(item._key, { name: e.target.value })} className={styles.input} />
              </label>
              <label className={clsx(styles.cell, styles.priceCell)}>
                <span className={styles.cellLabel}>מחיר ליחידה (₪)</span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={item.price}
                  onChange={(e) => update(item._key, { price: e.target.value })}
                  className={styles.input}
                />
              </label>
              <div className={styles.itemActions}>
                <ImageUploader folder="trays" label={item.imageUrl ? "החלפת תמונה" : "העלאת תמונה"} onUploaded={(url) => update(item._key, { imageUrl: url })} />
                <label className={styles.check}>
                  <input type="checkbox" checked={item.isActive} onChange={(e) => update(item._key, { isActive: e.target.checked })} />
                  <span>זמין להזמנה</span>
                </label>
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`הקדמת ${item.name || "פריט"}`} className={styles.iconButton}>
                  <ArrowUp size={14} strokeWidth={1.25} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label={`איחור ${item.name || "פריט"}`}
                  className={styles.iconButton}
                >
                  <ArrowDown size={14} strokeWidth={1.25} aria-hidden="true" />
                </button>
                <button type="button" className={styles.remove} onClick={() => onChange(items.filter((i) => i._key !== item._key))}>
                  הסרה
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {items.length < MAX && (
        <button
          type="button"
          className={styles.add}
          onClick={() => onChange([...items, { _key: crypto.randomUUID(), name: "", price: "", imageUrl: "", isActive: true }])}
        >
          <Plus size={16} strokeWidth={1.25} aria-hidden="true" /> הוספת פריט
        </button>
      )}
    </div>
  );
}
