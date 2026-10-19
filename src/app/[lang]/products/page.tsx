import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/dictionaries";
import { hasLocale } from "@/lib/i18n";
import { categoryIds, type CategoryId } from "@/lib/products";
import { listPublic } from "@/lib/store";
import { PageHero } from "@/components/page-hero";
import { ProductBrowser } from "@/components/product-browser";

export async function generateMetadata({ params }: PageProps<"/[lang]/products">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const d = getDictionary(lang);
  return {
    title: d.products.title,
    description: d.products.subtitle,
    alternates: { languages: { nl: "/nl/products", en: "/en/products" } },
  };
}

// Rendered per request (it reads ?category=), so the HTML always contains the current products for visitors and search engines.
export default async function ProductsPage({ params, searchParams }: PageProps<"/[lang]/products">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const sp = await searchParams;
  const c = Array.isArray(sp.category) ? sp.category[0] : sp.category;
  const initialCategory = categoryIds.includes(c as CategoryId) ? (c as CategoryId) : undefined;
  // ?q= comes from the search box on the home page; keep it short and plain.
  const rawQ = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const initialQuery = (rawQ ?? "").slice(0, 80);
  const d = getDictionary(lang);
  const products = await listPublic();

  return (
    <>
      <PageHero title={d.products.title} subtitle={d.products.subtitle} eyebrow={d.nav.products} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <ProductBrowser products={products} initialCategory={initialCategory} initialQuery={initialQuery} />
      </div>
    </>
  );
}
