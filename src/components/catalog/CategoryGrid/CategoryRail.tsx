"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import styles from "./CategoryGrid.module.css";

/**
 * Desktop: one row of tiles with arrows; trackpad two-finger scrolling works natively.
 * Phones keep the regular wrapping grid (the rail styles apply from 64em only).
 */
export function CategoryRail({ children }: { children: ReactNode }) {
  const listRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // In RTL scrollLeft runs from 0 down to negative values, so measure the distance with Math.abs.
  const update = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const offset = Math.abs(list.scrollLeft);
    setAtStart(offset < 2);
    setAtEnd(offset + list.clientWidth >= list.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(list);
    return () => observer.disconnect();
  }, [update]);

  // direction 1 = forward (toward the left in RTL).
  const scroll = (direction: 1 | -1) => {
    const list = listRef.current;
    if (!list) return;
    const rtl = getComputedStyle(list).direction === "rtl";
    list.scrollBy({ left: direction * (rtl ? -1 : 1) * list.clientWidth, behavior: "smooth" });
  };

  return (
    <div className={`reveal ${styles.railWrap}`}>
      <button type="button" className={`${styles.arrow} ${styles.arrowPrev}`} onClick={() => scroll(-1)} disabled={atStart} aria-label="הקטגוריות הקודמות">
        <ChevronRight size={22} strokeWidth={1.25} aria-hidden="true" />
      </button>
      <ul role="list" ref={listRef} className={`${styles.grid} ${styles.rail}`} onScroll={update}>
        {children}
      </ul>
      <button type="button" className={`${styles.arrow} ${styles.arrowNext}`} onClick={() => scroll(1)} disabled={atEnd} aria-label="הקטגוריות הבאות">
        <ChevronLeft size={22} strokeWidth={1.25} aria-hidden="true" />
      </button>
    </div>
  );
}
