import clsx from "clsx";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TrayBuilder } from "@/components/tray/TrayBuilder/TrayBuilder";
import { getTrayBySlug, getTrays } from "@/lib/data/trays";
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
  return {
    title: tray.title,
    description: tray.description ?? undefined,
    openGraph: tray.imageUrl ? { images: [tray.imageUrl] } : undefined,
  };
}

export default async function TrayPage({ params }: TrayPageProps) {
  const [tray, settings] = await Promise.all([loadTray(params), getSettings()]);
  if (!tray) notFound();

  const leadTime = effectiveLeadTimeHours(tray.leadTimeHours, settings.defaultLeadTimeHours);

  return (
    <div className={clsx("container", styles.page)}>
      <header className={styles.intro}>
        <nav aria-label="פירורי לחם">
          <ol role="list" className={styles.crumbs}>
            <li>
              <Link href="/">דף הבית</Link>
            </li>
            <li>מגשים</li>
          </ol>
        </nav>
        <h1 className={styles.title}>{tray.title}</h1>
        {tray.description && <p className={styles.description}>{tray.description}</p>}
        <p className={styles.note}>הזמנה לפחות {formatLeadTime(leadTime)} לפני מועד האיסוף · המחיר לפי יחידה</p>
      </header>

      <TrayBuilder tray={tray} />
    </div>
  );
}
