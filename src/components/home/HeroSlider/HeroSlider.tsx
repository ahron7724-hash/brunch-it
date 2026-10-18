"use client";

import clsx from "clsx";
import { Pause, Play } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";

import type { HeroSlide } from "@/lib/data/types";

import styles from "./HeroSlider.module.css";

const SLIDE_MS = 7000;

type HeroSliderProps = {
  slides: HeroSlide[];
  children: ReactNode;
};

/** Full-width hero: crossfading images (up to 10) or a muted looping video, with the text overlay as children. */
export function HeroSlider({ slides, children }: HeroSliderProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const canRotate = slides.length > 1 && slides.every((s) => s.mediaType === "image");

  // Advance on a timer; the timer is an external system, so it lives in an effect with cleanup.
  useEffect(() => {
    if (!canRotate || paused) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => window.clearInterval(id);
  }, [canRotate, paused, slides.length]);

  return (
    <section className={styles.hero} aria-label="באנר ראשי">
      <div className={styles.media} aria-hidden="true">
        {slides.map((slide, index) =>
          slide.mediaType === "video" ? (
            <video
              key={slide.id}
              className={clsx(styles.slide, index === active && styles.active)}
              src={slide.url}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <Image
              key={slide.id}
              src={slide.url}
              alt=""
              fill
              sizes="100vw"
              preload={index === 0}
              className={clsx(styles.slide, index === active && styles.active)}
            />
          )
        )}
      </div>
      <div className={styles.shade} />
      <div className={clsx("container", styles.content)}>{children}</div>

      {canRotate && (
        <div className={styles.controls}>
          <span className={clsx("ltr", styles.counter)} aria-hidden="true">
            {String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </span>
          <button
            type="button"
            className={styles.pause}
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "הפעלת החלפת התמונות" : "עצירת החלפת התמונות"}
          >
            {paused ? <Play size={16} strokeWidth={1.5} aria-hidden="true" /> : <Pause size={16} strokeWidth={1.5} aria-hidden="true" />}
          </button>
        </div>
      )}
    </section>
  );
}
