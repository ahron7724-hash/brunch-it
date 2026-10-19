"use client";

import clsx from "clsx";
import { Pause, Play } from "lucide-react";
import Image from "next/image";
import { useState, type CSSProperties } from "react";

import type { MediaItem } from "@/lib/data/types";

import styles from "./ImageStrips.module.css";

type ImageStripsProps = {
  top: MediaItem[];
  bottom: MediaItem[];
};

/** Two endless strips of close-up photos moving in opposite directions, with a pause control. */
export function ImageStrips({ top, bottom }: ImageStripsProps) {
  const [paused, setPaused] = useState(false);
  if (top.length === 0 && bottom.length === 0) return null;

  return (
    <section className={clsx(styles.strips, paused && styles.paused)} aria-label="תמונות מהמטבח">
      {top.length > 0 && <Strip items={top} direction="rtl" />}
      {bottom.length > 0 && <Strip items={bottom} direction="ltr" />}
      <div className={clsx("container", styles.controls)}>
        <button
          type="button"
          className={styles.pause}
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "הפעלת תנועת התמונות" : "עצירת תנועת התמונות"}
        >
          {paused ? <Play size={14} strokeWidth={1.5} aria-hidden="true" /> : <Pause size={14} strokeWidth={1.5} aria-hidden="true" />}
        </button>
      </div>
    </section>
  );
}

type StripProps = { items: MediaItem[]; direction: "rtl" | "ltr" };

function Strip({ items, direction }: StripProps) {
  // The list is rendered twice; the track moves by exactly one copy, so the loop is seamless.
  const copies = ["a", "b"] as const;

  return (
    <div className={styles.strip}>
      <ul role="list" className={clsx(styles.track, direction === "ltr" && styles.reverse)}>
        {copies.map((copy) =>
          items.map((item) => (
            <StripTile key={`${copy}-${item.id}`} item={item} copy={copy} />
          ))
        )}
      </ul>
    </div>
  );
}

function StripTile({ item, copy }: { item: MediaItem; copy: "a" | "b" }) {
  const [aspectRatio, setAspectRatio] = useState(1);

  return (
    <li
      className={styles.tile}
      aria-hidden={copy === "b"}
      style={{ "--image-aspect-ratio": aspectRatio } as CSSProperties}
    >
      <Image
        src={item.url}
        alt={copy === "a" ? item.alt : ""}
        fill
        sizes="50vw"
        className={styles.image}
        onLoad={(event) => {
          const { naturalWidth, naturalHeight } = event.currentTarget;
          if (naturalWidth > 0 && naturalHeight > 0) setAspectRatio(naturalWidth / naturalHeight);
        }}
      />
    </li>
  );
}
