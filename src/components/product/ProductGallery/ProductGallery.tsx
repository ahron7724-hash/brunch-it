"use client";

import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";

import type { Image as ProductImage } from "@/lib/data/types";

import styles from "./ProductGallery.module.css";

type ProductGalleryProps = { images: ProductImage[]; title: string };

/** Main product image with up to two more as selectable thumbnails. */
export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className={styles.gallery}>
      <div className={styles.main}>
        {current && (
          <Image
            src={current.url}
            alt={current.alt || title}
            fill
            sizes="(min-width: 56em) 60vw, 100vw"
            preload
            className={styles.image}
          />
        )}
      </div>

      {images.length > 1 && (
        <ul role="list" className={styles.thumbs} aria-label="תמונות נוספות">
          {images.map((image, index) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => setActive(index)}
                className={clsx(styles.thumb, index === active && styles.thumbActive)}
                aria-label={`תמונה ${index + 1}: ${image.alt || title}`}
                aria-pressed={index === active}
              >
                <Image src={image.url} alt="" fill sizes="8rem" className={styles.image} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
