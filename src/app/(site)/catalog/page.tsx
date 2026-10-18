import type { Metadata } from "next";

import { CatalogFilters } from "@/components/catalog/CatalogFilters/CatalogFilters";
import { CategoryGrid } from "@/components/catalog/CategoryGrid/CategoryGrid";
import { PageIntro } from "@/components/ui/PageIntro/PageIntro";
import { ProductGrid } from "@/components/catalog/ProductGrid/ProductGrid";
import { getCategories, getProducts } from "@/lib/data/catalog";
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
          <ProductGrid products={products} emptyText="לא נמצאו מוצרים שמתאימים לסינון." />
        </section>
      </div>
    </>
  );
}
