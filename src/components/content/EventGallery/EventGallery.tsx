"use client";

import clsx from "clsx";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Modal } from "@/components/ui/Modal/Modal";
import type { GalleryImage } from "@/lib/data/types";

import styles from "./EventGallery.module.css";

type EventGalleryProps = { images: GalleryImage[] };

/** Grid of event photos; clicking one opens it enlarged with previous/next navigation. */
export function EventGallery({ images }: EventGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const current = openIndex === null ? undefined : images[openIndex];

  const step = (delta: number) =>
    setOpenIndex((i) => (i === null ? null : (i + delta + images.length) % images.length));

  return (
    <>
      <ul role="list" className={styles.grid}>
        {images.map((image, index) => (
          <li key={image.id} className="reveal">
            <button
              type="button"
              className={styles.tile}
              onClick={() => setOpenIndex(index)}
              aria-label={`הגדלת התמונה: ${image.caption ?? image.alt}`}
            >
              <Image src={image.url} alt={image.alt} fill sizes="(min-width: 64em) 33vw, 50vw" className={styles.image} />
            </button>
            {image.caption && <p className={styles.caption}>{image.caption}</p>}
          </li>
        ))}
      </ul>

      <Modal open={current !== undefined} onClose={() => setOpenIndex(null)} title={current?.caption ?? "גלריה"}>
        {current && (
          <div className={styles.viewer}>
            <div className={styles.large}>
              <Image src={current.url} alt={current.alt} fill sizes="32rem" className={styles.largeImage} />
            </div>
            {images.length > 1 && (
              <div className={styles.nav}>
                <button type="button" onClick={() => step(-1)} aria-label="התמונה הקודמת" className={styles.arrow}>
                  <ArrowRight size={18} strokeWidth={1.25} aria-hidden="true" />
                </button>
                <span className={clsx("ltr", styles.count)}>
                  {(openIndex ?? 0) + 1} / {images.length}
                </span>
                <button type="button" onClick={() => step(1)} aria-label="התמונה הבאה" className={styles.arrow}>
                  <ArrowLeft size={18} strokeWidth={1.25} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
