import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/dictionaries";
import { hasLocale } from "@/lib/i18n";
import { PageHero } from "@/components/page-hero";
import { CartView } from "@/components/cart-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/cart">): Promise<Metadata> {
  const { lang } = await params;
  return { title: hasLocale(lang) ? getDictionary(lang).cart.title : undefined, robots: { index: false } };
}

export default async function CartPage({ params }: PageProps<"/[lang]/cart">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  return (
    <>
      <PageHero title={d.cart.title} eyebrow={d.nav.cart} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <CartView />
      </div>
    </>
  );
}
