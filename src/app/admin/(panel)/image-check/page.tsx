/* eslint-disable @next/next/no-img-element -- raw <img> on purpose: each exact URL must be requested once */
import type { Metadata } from "next";

import { AdminHeader } from "@/components/admin/AdminHeader/AdminHeader";
import { publicUrlForPath } from "@/lib/admin/storage";
import { adminClient } from "@/lib/auth/admin";

import styles from "./image-check.module.css";

export const metadata: Metadata = { title: "בדיקת תמונות", robots: { index: false } };

// Every width next/image can request (default deviceSizes + imageSizes) and the qualities in next.config.
const WIDTHS = [32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];
const IMAGE_FILE = /\.(webp|jpe?g|png|avif|gif)$/i;

const LOCAL_IMAGES = [
  "/brand/logo-horizontal.png",
  "/brand/logo-round.png",
  "/demo/about.webp",
  "/demo/hero-1.webp",
  "/demo/hero-2.webp",
  "/demo/hero-3.webp",
  "/demo/kashrut-certificate.webp",
  "/demo/photo-berry.webp",
  "/demo/photo-caramel.webp",
  "/demo/photo-chocolate.webp",
  "/demo/photo-citrus.webp",
  "/demo/photo-cream.webp",
  "/demo/photo-greens.webp",
  "/demo/photo-pistachio.webp",
  "/demo/photo-savory.webp",
  "/demo/photo-vanilla.webp",
];

function optimizedUrl(src: string, width: number, quality: number) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

/** The raw file plus every optimizer version of it. Hero slides also use quality 90. */
function versionsOf(src: string, folder: string) {
  const qualities = folder === "hero" ? [75, 90] : [75];
  return [src, ...qualities.flatMap((q) => WIDTHS.map((w) => optimizedUrl(src, w, q)))];
}

async function listStorageImages(): Promise<{ folder: string; url: string }[]> {
  const supabase = await adminClient();
  if (!supabase) return [];
  const bucket = supabase.storage.from("media");
  const { data: top } = await bucket.list("", { limit: 1000 });
  const folders = (top ?? []).filter((entry) => !entry.id).map((entry) => entry.name);
  const lists = await Promise.all(
    folders.map(async (folder) => {
      const { data } = await bucket.list(folder, { limit: 1000 });
      return (data ?? [])
        .filter((file) => IMAGE_FILE.test(file.name))
        .map((file) => ({ folder, url: publicUrlForPath(`${folder}/${file.name}`) }));
    })
  );
  return lists.flat();
}

export default async function ImageCheckPage() {
  const stored = await listStorageImages();
  const images = [...stored, ...LOCAL_IMAGES.map((url) => ({ folder: "local", url }))];
  const total = images.reduce((sum, image) => sum + versionsOf(image.url, image.folder).length, 0);

  return (
    <>
      <AdminHeader
        title="בדיקת תמונות לנטפרי"
        description={`${images.length} תמונות, ${total} קישורים. הדף טוען כל גרסה של כל תמונה כדי שתישלח לבדיקה. אפשר לרענן מדי פעם עד שכולן נפתחות.`}
      />
      <ol className={styles.list}>
        {images.map((image) => (
          <li key={image.url} className={styles.item}>
            <p className={styles.name}>
              {image.folder} / {image.url.split("/").pop()}
            </p>
            <div className={styles.versions}>
              {versionsOf(image.url, image.folder).map((src) => (
                <a key={src} href={src} target="_blank" rel="noopener noreferrer" className={styles.version} title={src}>
                  <img src={src} alt="" loading="eager" decoding="async" className={styles.thumb} />
                  <span className={styles.label}>{src.startsWith("/_next") ? new URL(src, "http://x").searchParams.get("w") + (src.endsWith("q=90") ? " q90" : "") : "מקור"}</span>
                </a>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
