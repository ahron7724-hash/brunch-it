import clsx from "clsx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EventGallery } from "@/components/content/EventGallery/EventGallery";
import { PageBanner } from "@/components/content/PageBanner/PageBanner";
import { ButtonLink } from "@/components/ui/Button/Button";
import { RichText } from "@/components/ui/RichText/RichText";
import { SectionHeading } from "@/components/ui/SectionHeading/SectionHeading";
import { getAboutPage, getGalleryImages } from "@/lib/data/content";

import styles from "./about.module.css";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "אודות",
  description: "הסיפור שלנו, איך אנחנו עובדות, ותמונות מאירועים.",
};

export default async function AboutPage() {
  const [page, gallery] = await Promise.all([getAboutPage(), getGalleryImages()]);
  if (!page) notFound();

  return (
    <>
      <PageBanner title={page.title} imageUrl={page.heroImageUrl} eyebrow="הסיפור שלנו" />

      <section className={clsx("container", "section", styles.story)}>
        <RichText text={page.bodyText} />
        <ButtonLink href="/catalog" variant="line">
          לקטלוג
        </ButtonLink>
      </section>

      {gallery.length > 0 && (
        <section className={clsx("section", styles.gallery)} aria-labelledby="gallery-title">
          <div className="container">
            <SectionHeading id="gallery-title" eyebrow="גלריה" title="מאירועים שהיינו בהם" />
            <EventGallery images={gallery} />
          </div>
        </section>
      )}
    </>
  );
}
