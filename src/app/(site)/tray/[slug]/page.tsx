import clsx from "clsx";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { HeroSlider } from "@/components/home/HeroSlider/HeroSlider";
import { TrayBuilder } from "@/components/tray/TrayBuilder/TrayBuilder";
import { getTrayBySlug, getTrays } from "@/lib/data/trays";
import type { HeroSlide, Tray } from "@/lib/data/types";
import { effectiveLeadTimeHours, formatLeadTime } from "@/lib/leadTime";
import { getSettings } from "@/lib/settings/get-settings";
import { slugParamSchema } from "@/lib/validation/catalog";

import styles from "./tray.module.css";

export const revalidate = 3600;

type TrayPageProps = { params: Promise<{ slug: string }> };

async function loadTray(params: TrayPageProps["params"]) {
  const slug = slugParamSchema.safeParse((await params).slug);
  if (!slug.success) return null;
  return getTrayBySlug(slug.data);
}

export async function generateStaticParams() {
  const trays = await getTrays();
  return trays.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: TrayPageProps): Promise<Metadata> {
  const tray = await loadTray(params);
  if (!tray) return {};
  const image = tray.heroImages[0]?.url ?? tray.imageUrl;
  return {
    title: tray.title,
    description: tray.description ?? undefined,
    openGraph: image ? { images: [image] } : undefined,
  };
}

/** The tray's hero images, or its home page image when it has none. */
function heroSlides(tray: Tray): HeroSlide[] {
  if (tray.heroImages.length > 0) {
    return tray.heroImages.map((img, i) => ({ id: `${tray.id}-${i}`, url: img.url, alt: img.alt, mediaType: "image" }));
  }
  return tray.imageUrl ? [{ id: tray.id, url: tray.imageUrl, alt: tray.title, mediaType: "image" }] : [];
}

export default async function TrayPage({ params }: TrayPageProps) {
  const [tray, settings] = await Promise.all([loadTray(params), getSettings()]);
  if (!tray) notFound();

  const leadTime = effectiveLeadTimeHours(tray.leadTimeHours, settings.defaultLeadTimeHours);
  const slides = heroSlides(tray);
  const note = <p className={styles.note}>הזמנה לפחות {formatLeadTime(leadTime)} לפני מועד האיסוף · המחיר לפי יחידה</p>;

  return (
    <>
      {slides.length > 0 && (
        <HeroSlider slides={slides}>
          <div className={styles.heroText}>
            <span className={styles.heroEyebrow}>מגש בהרכבה אישית</span>
            <h1 className={styles.heroTitle}>{tray.title}</h1>
            {tray.description && <p className={styles.heroDescription}>{tray.description}</p>}
          </div>
        </HeroSlider>
      )}

      <div className={clsx("container", styles.page)}>
        <header className={styles.intro}>
          <nav aria-label="פירורי לחם">
            <ol role="list" className={styles.crumbs}>
              <li>
                <Link href="/">דף הבית</Link>
              </li>
              <li>{tray.title}</li>
            </ol>
          </nav>
          {slides.length === 0 && (
            <>
              <h1 className={styles.title}>{tray.title}</h1>
              {tray.description && <p className={styles.description}>{tray.description}</p>}
            </>
          )}
          {note}
        </header>

        <TrayBuilder tray={tray} />
      </div>
    </>
  );
}
