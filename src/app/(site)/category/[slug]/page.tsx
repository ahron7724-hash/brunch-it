import clsx from "clsx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogFilters } from "@/components/catalog/CatalogFilters/CatalogFilters";
import { ProductGrid } from "@/components/catalog/ProductGrid/ProductGrid";
import { PageIntro } from "@/components/ui/PageIntro/PageIntro";
import { getCategoryBySlug, getProducts } from "@/lib/data/catalog";
import { parseCatalogSearch, slugParamSchema } from "@/lib/validation/catalog";

import styles from "./category.module.css";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function loadCategory(params: CategoryPageProps["params"]) {
  const slug = slugParamSchema.safeParse((await params).slug);
  if (!slug.success) return null;
  return getCategoryBySlug(slug.data);
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = await loadCategory(params);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description ?? undefined,
    openGraph: category.imageUrl ? { images: [category.imageUrl] } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const category = await loadCategory(params);
  if (!category) notFound();

  const search = parseCatalogSearch(await searchParams);
  const products = await getProducts({ categoryId: category.id, diet: search.diet, sort: search.sort });
  const basePath = `/category/${encodeURIComponent(category.slug)}`;

  return (
    <>
      <PageIntro
        title={category.name}
        description={category.description}
        crumbs={[{ href: "/catalog", label: "קטלוג" }]}
      />
      <section className={clsx("container", styles.products)} aria-label="מוצרים">
        <CatalogFilters basePath={basePath} current={search} />
        <ProductGrid products={products} emptyText="אין כרגע מוצרים בקטגוריה הזו שמתאימים לסינון." />
      </section>
    </>
  );
}
