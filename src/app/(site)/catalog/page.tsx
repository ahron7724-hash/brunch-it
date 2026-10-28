import type { Metadata } from "next";

import { CatalogFilters } from "@/components/catalog/CatalogFilters/CatalogFilters";
import { CategoryGrid } from "@/components/catalog/CategoryGrid/CategoryGrid";
import { ProductGrid } from "@/components/catalog/ProductGrid/ProductGrid";
import { PageIntro } from "@/components/ui/PageIntro/PageIntro";
import { SectionHeading } from "@/components/ui/SectionHeading/SectionHeading";
import { getCategories, getProducts } from "@/lib/data/catalog";
import type { Category, ProductSummary } from "@/lib/data/types";
import { parseCatalogSearch } from "@/lib/validation/catalog";

import styles from "./catalog.module.css";

export const metadata: Metadata = {
  title: "קטלוג",
  description: "כל העוגות והמגשים שלנו, עם סינון לפי חלבי, פרווה, ללא גלוטן וטבעוני.",
};

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const search = parseCatalogSearch(await searchParams);
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ diet: search.diet, sort: search.sort }),
  ]);
  const sections = groupByMainCategory(products, categories);

  return (
    <>
      <PageIntro title="קטלוג" description="כל המוצרים מוכנים בהזמנה מראש, טריים ליום האיסוף." />
      <div className="container">
        {categories.length > 0 && (
          <section className={styles.categories} aria-label="קטגוריות">
            <CategoryGrid categories={categories} />
          </section>
        )}
        <section aria-label="מוצרים" className={styles.products}>
          <CatalogFilters basePath="/catalog" current={search} />
          {sections.length === 0 ? (
            <ProductGrid products={[]} emptyText="לא נמצאו מוצרים שמתאימים לסינון." />
          ) : (
            sections.map((section, i) => (
              <section key={section.key} className={styles.group} aria-labelledby={`group-${i}`}>
                <SectionHeading
                  id={`group-${i}`}
                  eyebrow={section.products.length === 1 ? "מוצר אחד" : `${section.products.length} מוצרים`}
                  title={section.title}
                  link={section.href ? { href: section.href, label: "לדף הקטגוריה" } : undefined}
                />
                <ProductGrid products={section.products} />
              </section>
            ))
          )}
        </section>
      </div>
    </>
  );
}

type CatalogSection = { key: string; title: string; href: string | null; products: ProductSummary[] };

/**
 * One section per category, in category order. Each product appears once: under its chosen main
 * category, otherwise the first of its categories by category order. Products without an active
 * category go last.
 */
function groupByMainCategory(products: ProductSummary[], categories: Category[]): CatalogSection[] {
  const order = new Map(categories.map((c, i) => [c.slug, i]));
  const bySlug = new Map<string, ProductSummary[]>();
  const other: ProductSummary[] = [];

  for (const product of products) {
    const main =
      product.mainCategorySlug && order.has(product.mainCategorySlug)
        ? product.mainCategorySlug
        : product.categories
            .map((c) => c.slug)
            .filter((slug) => order.has(slug))
            .sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0))[0];
    if (main) bySlug.set(main, [...(bySlug.get(main) ?? []), product]);
    else other.push(product);
  }

  const sections: CatalogSection[] = categories.flatMap((c) => {
    const list = bySlug.get(c.slug);
    return list ? [{ key: c.id, title: c.name, href: `/category/${encodeURIComponent(c.slug)}`, products: list }] : [];
  });
  if (other.length > 0) sections.push({ key: "other", title: "עוד מוצרים", href: null, products: other });
  return sections;
}
