import clsx from "clsx";

import { CategoryGrid } from "@/components/catalog/CategoryGrid/CategoryGrid";
import { ProductGrid } from "@/components/catalog/ProductGrid/ProductGrid";
import { AboutTeaser } from "@/components/home/AboutTeaser/AboutTeaser";
import { HeroContent } from "@/components/home/HeroContent/HeroContent";
import { HeroSlider } from "@/components/home/HeroSlider/HeroSlider";
import { ImageStrips } from "@/components/home/ImageStrips/ImageStrips";
import { Testimonials } from "@/components/home/Testimonials/Testimonials";
import { SectionHeading } from "@/components/ui/SectionHeading/SectionHeading";
import { getCategories, getProducts } from "@/lib/data/catalog";
import { getAboutPage, getHeroSlides, getStripImages, getTestimonials } from "@/lib/data/content";
import { getSettings } from "@/lib/settings/get-settings";

import styles from "./page.module.css";

// Content changes from the admin panel trigger on-demand revalidation; this is a safety net.
export const revalidate = 3600;

export default async function HomePage() {
  const [settings, slides, strips, categories, featured, testimonials, about] = await Promise.all([
    getSettings(),
    getHeroSlides(),
    getStripImages(),
    getCategories(),
    getProducts({ featuredOnly: true, limit: 8 }),
    getTestimonials(),
    getAboutPage(),
  ]);

  return (
    <>
      <HeroSlider slides={slides}>
        <HeroContent settings={settings} />
      </HeroSlider>

      <ImageStrips top={strips.top} bottom={strips.bottom} />

      {categories.length > 0 && (
        <section className="section" aria-labelledby="categories-title">
          <div className="container">
            <SectionHeading
              id="categories-title"
              eyebrow="קטגוריות"
              title="לכל אירוע"
              link={{ href: "/catalog", label: "לכל הקטלוג" }}
            />
            <CategoryGrid categories={categories} />
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className={clsx("section", styles.featured)} aria-labelledby="featured-title">
          <div className="container">
            <SectionHeading
              id="featured-title"
              eyebrow="הקטלוג"
              title="הנבחרות שלנו"
              link={{ href: "/catalog", label: "לכל המוצרים" }}
            />
            <ProductGrid products={featured} />
          </div>
        </section>
      )}

      {testimonials.length > 0 && <Testimonials items={testimonials} />}

      {about && <AboutTeaser page={about} kashrutLine={settings.kashrutLine} />}
    </>
  );
}
