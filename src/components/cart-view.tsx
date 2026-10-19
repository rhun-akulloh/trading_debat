"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cartActions, useCartIds } from "@/lib/cart";
import { computeTotals } from "@/lib/order";
import { formatPrice } from "@/lib/products";
import { fmt, type Locale } from "@/lib/i18n";
import { site } from "@/lib/site";
import { useI18n } from "./i18n-provider";

export type CartProduct = {
  id: string;
  slug: string;
  article: string;
  title: Record<Locale, string>;
  kind: Record<Locale, string>;
  price: number;
  image: string;
};

/** Cart ids live in localStorage; this resolves them to live products (sold/removed machines drop out). */
export function useCartProducts() {
  const ids = useCartIds();
  const key = ids.join(",");
  // Results are tagged with the ids they were fetched for, so a stale response is never shown.
  const [fetched, setFetched] = useState<{ key: string; list: CartProduct[] } | null>(null);

  useEffect(() => {
    if (!key) return;
    let live = true;
    fetch(`/api/products/lookup?ids=${encodeURIComponent(key)}`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((list: CartProduct[]) => live && setFetched({ key, list }));
    return () => {
      live = false;
    };
  }, [key]);

  const ready = key === "" || fetched?.key === key;
  // keep the order the visitor added them in
  const items = key && fetched?.key === key
    ? key.split(",").map((id) => fetched.list.find((p) => p.id === id)).filter((p): p is CartProduct => !!p)
    : [];
  return { items, loading: !ready };
}

export function CartView() {
  const { locale, dict } = useI18n();
  const { items, loading } = useCartProducts();
  const totals = computeTotals(items.map((p) => p.price), "pickup");
  const vatOnly = Math.round(totals.subtotal * site.vatRate * 100) / 100;

  if (loading) return <div className="mx-auto h-64 max-w-xl animate-pulse rounded-xl bg-surface-2" aria-busy="true" />;

  if (items.length === 0) {
    return (
      <div className="bg-surface border-line mx-auto max-w-xl rounded-xl border border-dashed p-12 text-center">
        <ShoppingBag className="mx-auto size-14 text-muted" />
        <h2 className="mt-4 text-2xl font-extrabold">{dict.cart.empty}</h2>
        <p className="mt-2 text-muted">{dict.cart.emptyHint}</p>
        <Link href={`/${locale}/products`} className="bg-accent-gradient mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-bold text-[#0b1f1d]">
          {dict.home.ctaPrimary} <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <ul className="space-y-4">
        <AnimatePresence initial={false}>
          {items.map((p) => (
            <motion.li
              key={p.id}
              layout
              exit={{ opacity: 0, x: -40 }}
              className="bg-surface border-line shadow-card flex gap-4 rounded-xl border p-4 sm:gap-6 sm:p-5"
            >
              <Link href={`/${locale}/products/${p.slug}`} className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-2xl bg-surface-2 sm:w-40">
                <Image src={p.image} alt="" fill sizes="160px" className="object-cover" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-xs font-bold tracking-wider text-brand-2 uppercase">{p.kind[locale]}</p>
                <Link href={`/${locale}/products/${p.slug}`} className="truncate text-lg font-bold hover:text-brand-2">
                  {p.title[locale]}
                </Link>
                <p className="text-sm text-muted">#{p.article}</p>
                <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                  <div>
                    <p className="font-display text-xl font-extrabold">{formatPrice(p.price, locale)}</p>
                    <p className="text-xs text-muted">{dict.common.exclVat}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => cartActions.remove(p.id)}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted transition hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="size-4" /> {dict.cart.remove}
                  </button>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
        <li className="px-2 text-sm text-muted">{dict.cart.uniqueNote}</li>
      </ul>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="bg-surface border-line shadow-card rounded-xl border p-6">
          <h2 className="text-xl font-extrabold">{dict.checkout.summary}</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">{dict.cart.subtotal}</dt><dd className="font-semibold">{formatPrice(totals.subtotal, locale, true)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">{dict.cart.vat.replace("{rate}", String(site.vatRate * 100))}</dt><dd className="font-semibold">{formatPrice(vatOnly, locale, true)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">{dict.cart.shipping}</dt><dd className="text-right font-semibold">{dict.checkout.pickup} € 0 · {dict.checkout.delivery} € {site.deliveryPrice}</dd></div>
            <div className="flex justify-between border-t border-line pt-4 text-base"><dt className="font-bold">{dict.cart.total}</dt><dd className="font-display text-xl font-extrabold">{formatPrice(totals.total, locale, true)}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-muted">{fmt(dict.product.shippingNote, { price: site.deliveryPrice })}</p>
          <Link href={`/${locale}/checkout`} className="bg-accent-gradient mt-6 flex items-center justify-center gap-2 rounded-full py-4 font-bold text-[#0b1f1d] shadow-lg transition hover:-translate-y-0.5">
            {dict.cart.toCheckout} <ArrowRight className="size-5" />
          </Link>
          <Link href={`/${locale}/products`} className="mt-3 block text-center text-sm font-semibold text-muted hover:text-accent">
            {dict.cart.continue}
          </Link>
        </div>
      </aside>
    </div>
  );
}
