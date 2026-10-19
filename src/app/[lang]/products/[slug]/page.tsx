import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronRight, Mail, Phone, Truck, Zap } from "lucide-react";
import { getDictionary } from "@/dictionaries";
import { fmt, hasLocale, locales } from "@/lib/i18n";
import { formatPrice, relatedTo, specRows } from "@/lib/products";
import { getPublicBySlug, listPublic } from "@/lib/store";
import { site } from "@/lib/site";
import { Gallery } from "@/components/gallery";
import { AddToCart } from "@/components/add-to-cart";
import { ShareButton } from "@/components/share-button";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";

export const revalidate = 60;

// Pre-render what exists at build time; machines added later are rendered on first visit, then cached.
export async function generateStaticParams() {
  try {
    const products = await listPublic();
    return locales.flatMap((lang) => products.map((p) => ({ lang, slug: p.slug })));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps<"/[lang]/products/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const p = await getPublicBySlug(slug);
  if (!hasLocale(lang) || !p) return {};
  const d = getDictionary(lang);
  const desc = `${p.kind[lang]} ${p.title[lang]}${p.year ? ` (${p.year})` : ""} — ${formatPrice(p.price, lang)} ${d.common.exclVat}. ${d.common.soldHint}.`;
  return {
    title: `${p.title[lang]} — ${p.kind[lang]}`,
    description: desc,
    alternates: { languages: { nl: `/nl/products/${slug}`, en: `/en/products/${slug}` } },
    openGraph: { title: p.title[lang], description: desc, images: [{ url: p.images[0] }] },
  };
}

export default async function ProductPage({ params }: PageProps<"/[lang]/products/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const p = await getPublicBySlug(slug);
  if (!p) notFound();
  const d = getDictionary(lang);
  const specs = specRows(p, d, lang);
  const inclVat = p.price * (1 + site.vatRate);
  const sold = p.status === "sold";
  const others = relatedTo(p, await listPublic(), 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${p.title[lang]} — ${p.kind[lang]}`,
    sku: p.article,
    brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
    image: p.images.map((i) => `${site.url}${i}`),
    description: p.features[lang].join(". "),
    itemCondition: p.condition === "new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
    offers: {
      "@type": "Offer",
      url: `${site.url}/${lang}/products/${p.slug}`,
      priceCurrency: "EUR",
      price: p.price,
      availability: sold ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      seller: { "@type": "Organization", name: site.name },
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link href={`/${lang}`} className="hover:text-accent">{d.nav.home}</Link>
        <ChevronRight className="size-4" />
        <Link href={`/${lang}/products`} className="hover:text-accent">{d.nav.products}</Link>
        <ChevronRight className="size-4" />
        <Link href={`/${lang}/products?category=${p.category}`} className="hover:text-accent">{d.categories[p.category]}</Link>
        <ChevronRight className="size-4" />
        <span className="font-semibold text-ink">{p.title[lang]}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Gallery images={p.images} alt={`${p.title[lang]} — ${p.kind[lang]}`} />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ${p.condition === "new" ? "bg-ok text-white" : "bg-brand-gradient text-white"}`}>
              {d.condition[p.condition]}
            </span>
            {sold && <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold tracking-wide text-white uppercase">{d.sold}</span>}
            <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-bold text-muted">#{p.article}</span>
          </div>
          <p className="mt-4 text-sm font-bold tracking-wider text-brand-2 uppercase">{p.kind[lang]}</p>
          <h1 className="mt-1 text-4xl font-extrabold sm:text-5xl">{p.title[lang]}</h1>

          <div className="bg-surface border-line shadow-card mt-6 rounded-xl border p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-display text-5xl leading-none font-extrabold">{formatPrice(p.price, lang)}</p>
                <p className="mt-2 text-sm text-muted">
                  {d.common.exclVat} · {formatPrice(inclVat, lang, true)} {d.common.inclVat}
                </p>
              </div>
            </div>
            {sold && (
              <p className="mt-5 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">{d.soldNote}</p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              {!sold && <AddToCart id={p.id} size="lg" className="flex-1 sm:flex-none" />}
              <ShareButton title={p.title[lang]} />
            </div>
            <ul className="mt-6 space-y-2.5 border-t border-line pt-5 text-sm">
              <li className="flex gap-3"><Truck className="mt-0.5 size-5 shrink-0 text-brand-2" /> {fmt(d.product.shippingNote, { price: site.deliveryPrice })}</li>
              <li className="flex gap-3"><Zap className="mt-0.5 size-5 shrink-0 text-brand-2" /> {d.common.soldHint}</li>
            </ul>
            <p className="mt-4 text-xs text-muted">{d.product.orderText} {d.product.businessOnly}</p>
          </div>

          {p.features[lang].length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold">{d.product.featuresTitle}</h2>
              <ul className="mt-4 space-y-2.5">
                {p.features[lang].map((f) => (
                  <li key={f} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-xl font-bold">{d.product.specsTitle}</h2>
            <dl className="border-line mt-4 divide-y divide-line overflow-hidden rounded-2xl border bg-surface">
              {specs.map((s, i) => (
                <div key={s.label} className={`flex justify-between gap-4 px-5 py-3 text-sm ${i % 2 ? "bg-surface-2/50" : ""}`}>
                  <dt className="text-muted">{s.label}</dt>
                  <dd className="text-right font-semibold">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="bg-brand-gradient mt-8 rounded-xl p-6 text-white">
            <h2 className="text-lg font-bold">{d.product.askTitle}</h2>
            <p className="mt-1 text-sm text-white/75">{d.product.askText}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href={`tel:${site.phoneHref}`} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-brand-deep">
                <Phone className="size-4" /> {site.phone}
              </a>
              <a href={`mailto:${site.email}?subject=${encodeURIComponent(`${p.title[lang]} (#${p.article})`)}`} className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-3 text-sm font-bold">
                <Mail className="size-4" /> {d.common.mailUs}
              </a>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-20">
        <h2 className="mb-6 text-2xl font-extrabold sm:text-3xl">{d.product.related}</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.08}>
              <ProductCard product={r} />
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
