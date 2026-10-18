"use client";

import clsx from "clsx";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";

import type { Testimonial } from "@/lib/data/types";

import styles from "./Testimonials.module.css";

type TestimonialsProps = { items: Testimonial[] };

/** One quote at a time, typographic, with previous/next controls. */
export function Testimonials({ items }: TestimonialsProps) {
  const [index, setIndex] = useState(0);
  const current = items[index];
  if (!current) return null;

  const go = (step: number) => setIndex((i) => (i + step + items.length) % items.length);

  return (
    <section className={styles.section} aria-labelledby="testimonials-title">
      <div className={clsx("reveal", styles.inner)}>
        <h2 id="testimonials-title" className="eyebrow">
          מה אומרים עלינו
        </h2>

        <figure className={styles.quote} aria-live="polite">
          <span className={styles.stars} role="img" aria-label={`דירוג ${current.rating} מתוך 5`}>
            {"★".repeat(current.rating)}
          </span>
          <blockquote className={styles.text}>{current.content}</blockquote>
          <figcaption className={styles.who}>
            <b className={styles.name}>{current.clientName}</b>
            {current.eventLabel && <span> · {current.eventLabel}</span>}
          </figcaption>
        </figure>

        {items.length > 1 && (
          <div className={styles.nav}>
            <button type="button" onClick={() => go(-1)} aria-label="ההמלצה הקודמת" className={styles.arrow}>
              <ArrowRight size={18} strokeWidth={1.25} aria-hidden="true" />
            </button>
            <span className={clsx("ltr", styles.count)}>
              {index + 1} / {items.length}
            </span>
            <button type="button" onClick={() => go(1)} aria-label="ההמלצה הבאה" className={styles.arrow}>
              <ArrowLeft size={18} strokeWidth={1.25} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
