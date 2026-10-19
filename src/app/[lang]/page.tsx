import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Banknote, Check, PackageCheck, Search, ShieldCheck, Truck } from "lucide-react";
import { getDictionary } from "@/dictionaries";
import { fmt, hasLocale } from "@/lib/i18n";
import { categoryIds, uniqueBrands } from "@/lib/products";
import { listPublic } from "@/lib/store";
import { site } from "@/lib/site";
import { Reveal } from "@/components/reveal";
import { ProductCard } from "@/components/product-card";

// Hand-picked covers where the first photo of a category doesn't show the machine well.
const coverOverrides: Partial<Record<string, string>> = { palletwagens: "/products/1_43zs9d2l.webp" };

export const revalidate = 60;

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <span className="mb-3 block h-1.5 w-12 rounded-full bg-accent" aria-hidden="true" />
      <div>
        <h2 className="text-3xl font-black sm:text-4xl">{title}</h2>
        {subtitle && <p className="mt-1.5 text-muted">{subtitle}</p>}
      </div>
    </div>
  );
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  const products = await listPublic();
  const forSale = products.filter((p) => p.status === "published");
  const brands = uniqueBrands(products);
  // Owner-flagged machines first; otherwise the newest ones.
  const featured = [...forSale.filter((p) => p.featured), ...forSale.filter((p) => !p.featured)].slice(0, 6);
  const countIn = (c: string) => products.filter((p) => p.category === c).length;

  return (
    <>
      {/* ───────── Hero: headline on the left, "find a machine" panel on the right ───────── */}
      <section className="bg-brand-gradient relative isolate overflow-hidden text-white">
        <div className="mesh">
          <i className="-top-40 -right-24 size-[30rem] bg-accent/20" />
          <i className="-bottom-48 -left-24 size-[28rem] bg-accent/10" style={{ animationDelay: "-9s" }} />
        </div>
        <div className="grid-bg pointer-events-none absolute inset-0" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14 lg:pt-20 lg:pb-28">
          <div>
            <Reveal y={14}>
              <span className="inline-flex items-center gap-2 rounded bg-accent px-3 py-1.5 text-xs font-extrabold tracking-wider text-[#0b1f1d] uppercase">
                {dict.home.badge}
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="mt-6 text-[2.2rem] leading-[1.05] font-black sm:text-5xl lg:text-6xl">
                {dict.home.title1}
                <br />
                <span className="text-gradient">{dict.home.title2}</span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">{dict.home.subtitle}</p>
            </Reveal>
            <Reveal delay={0.24} className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/${lang}/products`}
                className="bg-accent-gradient group inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-4 font-extrabold tracking-wide text-[#0b1f1d] uppercase transition hover:-translate-y-0.5 sm:w-auto"
              >
                {dict.home.ctaPrimary}
                <ArrowRight className="size-5 transition group-hover:translate-x-1" />
              </Link>
              <Link
                href={`/${lang}/sell`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-white/30 px-7 py-4 font-extrabold tracking-wide uppercase transition hover:border-accent hover:text-accent sm:w-auto"
              >
                {dict.home.ctaSecondary}
              </Link>
            </Reveal>
            <Reveal delay={0.32}>
              <ul className="mt-8 grid gap-2.5 text-sm font-semibold text-white/85 sm:grid-cols-3">
                {dict.home.trust.map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="grid size-5 shrink-0 place-items-center rounded-sm bg-accent text-[#0b1f1d]">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal delay={0.2}>
            <div className="bg-surface text-ink border-accent rounded-3xl border-b-4 p-6 shadow-2xl sm:p-7">
              <h2 className="text-2xl font-black">{dict.home.finderTitle}</h2>
              <p className="mt-1 text-sm font-semibold text-brand-2">{fmt(dict.home.inStock, { n: forSale.length })}</p>

              <form action={`/${lang}/products`} method="get" className="mt-5 flex gap-2" role="search">
                <label htmlFor="finder-q" className="sr-only">
                  {dict.home.finderPlaceholder}
                </label>
                <input
                  id="finder-q"
                  name="q"
                  type="search"
                  placeholder={dict.home.finderPlaceholder}
                  className="min-w-0 flex-1 rounded-lg border-2 border-line bg-bg px-4 py-3 font-medium outline-none transition focus:border-accent"
                />
                <button
                  type="submit"
                  className="bg-accent-gradient inline-flex items-center gap-2 rounded-lg px-4 font-extrabold text-[#0b1f1d]"
                  aria-label={dict.home.finderButton}
                >
                  <Search className="size-5" />
                  <span className="hidden sm:inline">{dict.home.finderButton}</span>
                </button>
              </form>

              <p className="mt-6 mb-3 text-xs font-extrabold tracking-widest text-muted uppercase">{dict.home.finderOr}</p>
              <ul className="grid grid-cols-2 gap-2.5">
                {categoryIds.map((c) => (
                  <li key={c}>
                    <Link
                      href={`/${lang}/products?category=${c}`}
                      className="group flex items-center justify-between gap-2 rounded-lg border-2 border-line px-3.5 py-3 transition hover:border-accent hover:bg-accent/10"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-extrabold">{dict.categories[c]}</span>
                        <span className="text-xs text-muted">{countIn(c)}</span>
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <div className="hazard absolute inset-x-0 bottom-0 h-2" />
      </section>

      {/* ───────── Featured: a grid, three on a phone, six on bigger screens ───────── */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <SectionTitle title={dict.home.featuredTitle} subtitle={dict.home.featuredSubtitle} />
          <Link href={`/${lang}/products`} className="group inline-flex items-center gap-2 text-sm font-extrabold tracking-wide text-brand-2 uppercase hover:text-ink">
            {dict.common.viewAll} <ArrowRight className="size-4 transition group-hover:translate-x-1" />
          </Link>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => (
            <div key={p.id} className={i >= 3 ? "hidden sm:block" : undefined}>
              <ProductCard product={p} priority={i < 3} />
            </div>
          ))}
        </div>
      </section>

      {/* ───────── Categories: compact tiles with a photo ───────── */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <Reveal className="mb-8">
          <SectionTitle title={dict.home.categoriesTitle} subtitle={dict.home.categoriesSubtitle} />
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2">
          {categoryIds.map((c, i) => {
            const list = products.filter((p) => p.category === c);
            if (list.length === 0) return null;
            const cover = coverOverrides[c] ?? list[0].images[0];
            return (
              <Reveal key={c} delay={i * 0.06}>
                <Link
                  href={`/${lang}/products?category=${c}`}
                  className={`group bg-surface flex items-stretch overflow-hidden rounded-2xl border-2 border-line transition-colors hover:border-accent ${i % 2 ? "flex-row-reverse" : ""}`}
                >
                  <span className="relative block w-32 shrink-0 sm:w-44">
                    <Image
                      src={cover}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 176px, 128px"
                      className="object-cover object-[50%_70%] transition duration-500 group-hover:scale-105"
                    />
                  </span>
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-3 p-4 sm:p-5">
                    <span className="min-w-0">
                      <span className="block text-xl font-black">{dict.categories[c]}</span>
                      <span className="mt-1 block text-sm text-muted">{dict.categoryBlurbs[c]}</span>
                      <span className="mt-2 inline-block rounded bg-accent px-2 py-0.5 text-xs font-extrabold text-[#0b1f1d]">
                        {list.length} {lang === "nl" ? "stuks" : "pcs"}
                      </span>
                    </span>
                    <ArrowRight className="size-5 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-ink" />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ───────── Brands ───────── */}
      <section className="mt-20 border-y border-line bg-surface py-8" aria-label={dict.home.marqueeBrands}>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
          <div className="animate-marquee flex w-max gap-14 whitespace-nowrap">
            {[...brands, ...brands, ...brands, ...brands].map((b, i) => (
              <span key={i} className="font-display text-3xl font-black tracking-tight text-muted/40 uppercase sm:text-4xl" aria-hidden={i >= brands.length}>
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Sell CTA: dark band ───────── */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="bg-brand-gradient relative isolate overflow-hidden rounded-3xl p-8 text-white sm:p-12">
            <div className="hazard absolute inset-x-0 top-0 h-2" />
            <div className="absolute -right-24 -bottom-24 size-80 rounded-full bg-accent/15 blur-3xl" />
            <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <div>
                <h2 className="text-3xl font-black sm:text-5xl">{dict.home.sellTitle}</h2>
                <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/75">{dict.home.sellText}</p>
                <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-semibold">
                  {dict.home.sellBullets.map((b, i) => {
                    const Icon = [Banknote, Truck, ShieldCheck][i];
                    return (
                      <li key={b} className="inline-flex items-center gap-2">
                        <Icon className="size-5 text-accent" /> {b}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="flex flex-col gap-3 lg:items-end">
                <Link
                  href={`/${lang}/sell`}
                  className="bg-accent-gradient group inline-flex items-center justify-center gap-2 rounded-full px-8 py-5 text-lg font-extrabold tracking-wide text-[#0b1f1d] uppercase transition hover:-translate-y-0.5"
                >
                  <PackageCheck className="size-5" /> {dict.home.sellCta}
                  <ArrowRight className="size-5 transition group-hover:translate-x-1" />
                </Link>
                <a href={`tel:${site.phoneHref}`} className="text-center font-bold underline-offset-4 hover:text-accent hover:underline lg:text-right">
                  {dict.common.callUs}: {site.phone}
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
