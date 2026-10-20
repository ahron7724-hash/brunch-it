"use client";

import clsx from "clsx";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import Image from "next/image";

import { ImageUploader } from "@/components/admin/ImageUploader/ImageUploader";
import type { UploadFolder } from "@/lib/admin/uploadImage";

import styles from "./ProductImagesField.module.css";

export type ProductImageValue = { _key: string; id?: string; url: string; alt: string };

type ProductImagesFieldProps = {
  images: ProductImageValue[];
  onChange: (images: ProductImageValue[]) => void;
  max?: number;
  folder?: UploadFolder;
};

/** Up to `max` images: upload, describe, reorder, remove. Changes are saved with the form they're in. */
export function ProductImagesField({ images, onChange, max = 3, folder = "products" }: ProductImagesFieldProps) {
  const move = (index: number, delta: number) => {
    const next = [...images];
    const [item] = next.splice(index, 1);
    if (item) next.splice(index + delta, 0, item);
    onChange(next);
  };

  return (
    <div className={styles.field}>
      <ul role="list" className={styles.list}>
        {images.map((image, index) => (
          <li key={image._key} className={clsx(styles.item, index === 0 && styles.main)}>
            <div className={styles.thumb}>
              <Image src={image.url} alt="" fill sizes="12rem" className={styles.image} />
              {index === 0 && <span className={styles.badge}>תמונה ראשית</span>}
              <button
                type="button"
                className={styles.remove}
                onClick={() => onChange(images.filter((img) => img._key !== image._key))}
                aria-label={`הסרת תמונה ${index + 1}`}
              >
                <X size={16} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
            <input
              aria-label={`תיאור קצר לתמונה ${index + 1} (לנגישות)`}
              placeholder="תיאור קצר (לנגישות)"
              value={image.alt}
              maxLength={200}
              onChange={(e) => onChange(images.map((img) => (img._key === image._key ? { ...img, alt: e.target.value } : img)))}
              className={styles.alt}
            />
            <div className={styles.moves}>
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="הקדמה" className={styles.iconButton}>
                <ArrowUp size={14} strokeWidth={1.25} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === images.length - 1} aria-label="איחור" className={styles.iconButton}>
                <ArrowDown size={14} strokeWidth={1.25} aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
        {images.length < max && (
          <li className={styles.addSlot}>
            <ImageUploader
              folder={folder}
              label={`הוספת תמונה (${images.length}/${max})`}
              onUploaded={(url) => onChange([...images, { _key: crypto.randomUUID(), url, alt: "" }])}
            />
          </li>
        )}
      </ul>
    </div>
  );
}
