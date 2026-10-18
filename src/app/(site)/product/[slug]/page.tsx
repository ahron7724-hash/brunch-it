import clsx from "clsx";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductGallery } from "@/components/product/ProductGallery/ProductGallery";
import { ProductPurchase } from "@/components/product/ProductPurchase/ProductPurchase";
import { BidiText } from "@/components/ui/BidiText/BidiText";
import { getAllProductSlugs, getProductBySlug } from "@/lib/data/catalog";
import { DIET_LABELS } from "@/lib/data/types";
import { formatPrice } from "@/lib/format";
import { effectiveLeadTimeHours, formatLeadTime } from "@/lib/leadTime";
import { getSettings } from "@/lib/settings/get-settings";
import { slugParamSchema } from "@/lib/validation/catalog";

import styles from "./product.module.css";

export const revalidate = 3600;

type ProductPageProps = { params: Promise<{ slug: string }> };

async function loadProduct(params: ProductPageProps["params"]) {
  const slug = slugParamSchema.safeParse((await params).slug);
  if (!slug.success) return null;
  return getProductBySlug(slug.data);
}

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await loadProduct(params);
  if (!product) return {};
  return {
    title: product.title,
    description: product.description ?? undefined,
    openGraph: product.image ? { images: [product.image.url] } : undefined,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const [product, settings] = await Promise.all([loadProduct(params), getSettings()]);
  if (!product) notFound();

  const leadTime = effectiveLeadTimeHours(product.leadTimeHours, settings.defaultLeadTimeHours);
  const category = product.categories[0];
  const singleSize = product.sizes.length === 1 ? product.sizes[0] : undefined;

  return (
    <div className={clsx("container", styles.layout)}>
      <ProductGallery images={product.images} title={product.title} />

      <div className={styles.info}>
        <nav aria-label="פירורי לחם">
          <ol role="list" className={styles.crumbs}>
            <li>
              <Link href="/catalog">קטלוג</Link>
            </li>
            {category && (
              <li>
                <Link href={`/category/${encodeURIComponent(category.slug)}`}>{category.name}</Link>
              </li>
            )}
          </ol>
        </nav>

        <div className={styles.titleBlock}>
          {product.dietTags.length > 0 && (
            <span className={styles.diet}>{product.dietTags.map((t) => DIET_LABELS[t]).join(" · ")}</span>
          )}
          <h1 className={styles.title}>{product.title}</h1>
          {singleSize && (
            <p className={styles.price}>
              {formatPrice(singleSize.price)}
              {singleSize.serves && <span className={styles.serves}> · <BidiText text={singleSize.serves} /></span>}
            </p>
          )}
        </div>

        {product.description && <p className={styles.description}>{product.description}</p>}

        <dl className={styles.details}>
          {product.contents && (
            <div className={styles.detail}>
              <dt>מה בפנים</dt>
              <dd>{product.contents}</dd>
            </div>
          )}
          <div className={styles.detail}>
            <dt>הזמנה מראש</dt>
            <dd>לפחות {formatLeadTime(leadTime)} לפני מועד האיסוף</dd>
          </div>
        </dl>

        <ProductPurchase product={product} />
      </div>
    </div>
  );
}
