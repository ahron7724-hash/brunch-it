import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminHeader } from "@/components/admin/AdminHeader/AdminHeader";
import { ProductDelete } from "@/components/admin/ProductDelete/ProductDelete";
import { ProductDetailsFields } from "@/components/admin/ProductDetailsFields/ProductDetailsFields";
import { ProductEditor } from "@/components/admin/ProductEditor/ProductEditor";
import { getAdminProduct, listAdminCategories } from "@/lib/admin/products";
import { getSettings } from "@/lib/settings/get-settings";

import { saveProduct } from "../actions";

type EditProductPageProps = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: EditProductPageProps) {
  const [product, categories, settings] = await Promise.all([getAdminProduct((await params).id), listAdminCategories(), getSettings()]);
  if (!product) notFound();

  return (
    <>
      <AdminHeader
        title={product.title}
        description={product.is_active ? "מוצג באתר" : "מוסתר – לא מופיע באתר"}
        back={{ href: "/admin/products", label: "כל המוצרים" }}
      >
        <Link href={`/admin/products/${product.id}/recipe`}>מתכון ושלבי הכנה ←</Link>
        {product.is_active && (
          <a href={`/product/${encodeURIComponent(product.slug)}`} target="_blank" rel="noopener noreferrer">
            צפייה בעמוד המוצר ↗
          </a>
        )}
      </AdminHeader>

      <ProductEditor
        action={saveProduct.bind(null, product.id)}
        images={product.product_images.map((i) => ({ id: i.id, url: i.url, alt: i.alt ?? "" }))}
        sizes={product.product_sizes.map((s) => ({ id: s.id, label: s.label, price: String(s.price), unitCount: String(s.unit_count), serves: s.serves ?? "" }))}
        options={product.product_options.map((o) => ({ id: o.id, groupName: o.group_name, label: o.label, extraPrice: String(o.extra_price) }))}
      >
        <ProductDetailsFields
          product={product}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          defaultLeadTimeHours={settings.defaultLeadTimeHours}
        />
      </ProductEditor>

      <ProductDelete productId={product.id} />
    </>
  );
}
