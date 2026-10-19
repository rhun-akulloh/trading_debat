"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Eye, EyeOff, Pencil, Search, Star, Trash2 } from "lucide-react";
import { deleteProduct, setStatus } from "@/app/admin/actions";
import { fmt } from "@/lib/i18n";
import { formatPrice, type Product, type Status } from "@/lib/products";
import { useAdmin } from "./admin-i18n-provider";

const STATUS_CLS: Record<Status, string> = {
  published: "bg-ok/15 text-ok",
  sold: "bg-red-500/15 text-red-500",
  hidden: "bg-surface-2 text-muted",
};

export function ProductList({ products, writable }: { products: Product[]; writable: boolean }) {
  const { lang, t } = useAdmin();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Status | "all">("all");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter(
      (p) =>
        (filter === "all" || p.status === filter) &&
        (!needle || [p.title.nl, p.title.en, p.brand, p.model, p.article].join(" ").toLowerCase().includes(needle)),
    );
  }, [products, q, filter]);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError("");
      const res = await fn();
      if (!res.ok) setError(res.error ?? t.common.error);
    });

  const remove = (p: Product) => {
    if (confirm(fmt(t.list.confirmDelete, { title: p.title.nl }))) run(() => deleteProduct(p.id));
  };

  const tab = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "bg-brand-gradient text-white shadow" : "bg-surface text-muted hover:text-ink border border-line"}`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.list.search}
            className="w-full rounded-full border border-line bg-surface py-3 pr-4 pl-11 text-sm font-medium outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "published", "sold", "hidden"] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={tab(filter === s)}>
              {s === "all" ? t.list.all : t.status[s]}{" "}
              <span className="opacity-70">{s === "all" ? products.length : products.filter((p) => p.status === s).length}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">
          {error}
        </p>
      )}

      <ul className={`mt-5 space-y-3 transition-opacity ${pending ? "opacity-60" : ""}`}>
        {shown.map((p) => (
          <li key={p.id} className="bg-surface border-line shadow-card flex flex-wrap items-center gap-4 rounded-2xl border p-3 sm:flex-nowrap sm:p-4">
            <Link href={`/admin/products/${p.id}`} className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:w-28">
              <Image src={p.images[0]} alt="" fill sizes="112px" className="object-cover" unoptimized={p.images[0].startsWith("/uploads/")} />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/products/${p.id}`} className="truncate font-bold hover:text-brand-2">
                  {p.title.nl}
                </Link>
                {p.featured && <Star className="size-4 fill-accent text-accent" aria-label={t.list.featured} />}
              </div>
              <p className="mt-0.5 text-sm text-muted">
                #{p.article} · {t.category[p.category]} · {t.condition[p.condition]}
              </p>
              <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_CLS[p.status]}`}>{t.status[p.status]}</span>
            </div>
            <p className="font-display text-lg font-extrabold">{formatPrice(p.price, lang)}</p>
            <div className="flex w-full items-center justify-end gap-1.5 sm:w-auto">
              <select
                aria-label={fmt(t.list.statusOf, { title: p.title.nl })}
                value={p.status}
                disabled={!writable || pending}
                onChange={(e) => run(() => setStatus(p.id, e.target.value as Status))}
                className="rounded-full border border-line bg-surface px-3 py-2 text-sm font-semibold"
              >
                <option value="published">{t.status.published}</option>
                <option value="sold">{t.status.sold}</option>
                <option value="hidden">{t.status.hidden}</option>
              </select>
              <Link href={`/nl/products/${p.slug}`} target="_blank" aria-label={t.common.viewOnSite} title={t.common.viewOnSite}
                className="grid size-10 place-items-center rounded-full border border-line text-muted transition hover:border-accent hover:text-accent">
                {p.status === "hidden" ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Link>
              <Link href={`/admin/products/${p.id}`} aria-label={t.list.edit} title={t.list.edit}
                className="grid size-10 place-items-center rounded-full border border-line text-muted transition hover:border-accent hover:text-accent">
                <Pencil className="size-4" />
              </Link>
              <button type="button" onClick={() => remove(p)} disabled={!writable || pending} aria-label={t.list.remove} title={t.list.remove}
                className="grid size-10 place-items-center rounded-full border border-line text-muted transition hover:border-red-500 hover:text-red-500 disabled:opacity-40">
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {shown.length === 0 && <p className="mt-10 text-center text-muted">{t.list.none}</p>}
    </div>
  );
}
