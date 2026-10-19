import clsx from "clsx";
import Image from "next/image";
import type { CSSProperties } from "react";

import type { TrayItem } from "@/lib/data/types";

import styles from "./TraySection.module.css";

type TrayStripProps = { items: TrayItem[]; reverse?: boolean };

/** Fewest tiles in one copy of the strip, so it always spans a wide screen. */
const MIN_TILES = 10;
/** Seconds per tile: the speed stays the same however many items there are. */
const SECONDS_PER_TILE = 4;

/** An endless moving strip of the tray's item photos with their names. */
export function TrayStrip({ items, reverse = false }: TrayStripProps) {
  const withImages = items.flatMap((item) => (item.imageUrl ? [{ ...item, imageUrl: item.imageUrl }] : []));
  if (withImages.length === 0) return null;

  // Repeat short lists so one copy is wider than the screen, then render it twice for a seamless loop.
  const repeats = Math.ceil(MIN_TILES / withImages.length);
  const copy = Array.from({ length: repeats }, (_, r) => withImages.map((item) => ({ item, key: `${r}-${item.id}` }))).flat();
  // The duration is passed to CSS as a custom property (the one allowed inline style).
  const speed = { "--strip-duration": `${copy.length * SECONDS_PER_TILE}s` } as CSSProperties;

  return (
    <div className={styles.stripWrap}>
      <div className={styles.strip}>
        <ul role="list" className={clsx(styles.track, reverse && styles.reverse)} style={speed}>
          {(["a", "b"] as const).map((half) =>
            copy.map(({ item, key }, index) => {
              // Only the first appearance of each item is announced; the repeats are decoration.
              const hidden = half === "b" || index >= withImages.length;
              return (
                <li key={`${half}-${key}`} className={styles.tile} aria-hidden={hidden || undefined}>
                  <span className={styles.tileImage}>
                    <Image src={item.imageUrl} alt="" fill sizes="10rem" className={styles.image} />
                  </span>
                  <span className={styles.tileName}>{item.name}</span>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
