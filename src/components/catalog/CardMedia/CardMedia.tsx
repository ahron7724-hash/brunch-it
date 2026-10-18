"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import type { Image as ProductImage } from "@/lib/data/types";

import styles from "./CardMedia.module.css";

const STEP_MS = 1400;

type CardMediaProps = {
  href: string;
  images: ProductImage[];
  sizes: string;
  /** Overlay controls on the image (the quick-view button). */
  children?: ReactNode;
};

/**
 * The card's photo area. With more than one image, hovering it (including the quick-view button)
 * cycles through them, the second appearing right away; leaving returns to the main image.
 */
export function CardMedia({ href, images, sizes, children }: CardMediaProps) {
  const [hovered, setHovered] = useState(false);
  const [index, setIndex] = useState(0);
  const canCycle = images.length > 1;

  // A timer is an external system: start it while hovered, clean it up on leave.
  useEffect(() => {
    if (!hovered || !canCycle) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % images.length), STEP_MS);
    return () => window.clearInterval(id);
  }, [hovered, canCycle, images.length]);

  return (
    <div
      className={styles.media}
      onMouseEnter={() => {
        if (!canCycle) return;
        setHovered(true);
        setIndex(1);
      }}
      onMouseLeave={() => {
        setHovered(false);
        setIndex(0);
      }}
    >
      <Link href={href} className={styles.imageLink} tabIndex={-1} aria-hidden="true">
        {images.length === 0 && <span className={styles.noImage} />}
        {images.map((image, i) => (
          <Image
          key={image.url}
          src={image.url}
          alt=""
          fill
          sizes={sizes}
          className={clsx(styles.image, i === index && styles.active)}
          />
        ))}
      </Link>
      {canCycle && (
        <span className={styles.dots} aria-hidden="true">
          {images.map((image, i) => (
            <span key={image.url} className={clsx(styles.dot, i === index && styles.dotActive)} />
          ))}
        </span>
      )}
      {children}
    </div>
  );
}
