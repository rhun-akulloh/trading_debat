"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react";
import { categoryIds, uniqueBrands, type CategoryId, type Product } from "@/lib/products";
import { fmt } from "@/lib/i18n";
import { useI18n } from "./i18n-provider";
import { ProductCard } from "./product-card";

type Sort = "relevance" | "priceAsc" | "priceDesc" | "yearDesc" | "hoursAsc";

const chip = (active: boolean) =>
  `rounded-full border px-4 py-2 text-sm font-semibold transition ${
    active
      ? "border-transparent bg-brand-gradient text-white shadow-md"
      : "border-line bg-surface text-muted hover:border-accent hover:text-ink"
  }`;

export function ProductBrowser({
  products,
  initialCategory,
  initialQuery = "",
}: {
  products: Product[];
  initialCategory?: CategoryId;
  initialQuery?: string;
}) {
  const { dict } = useI18n();
  const brands = useMemo(() => uniqueBrands(products), [products]);
  const maxPrice = useMemo(() => Math.max(0, ...products.map((p) => p.price)), [products]);
  const [q, setQ] = useState(initialQuery);
  const [category, setCategory] = useState<CategoryId | "all">(initialCategory ?? "all");
  const [brand, setBrand] = useState<string>("all");
  const [condition, setCondition] = useState<"all" | "new" | "used">("all");
  const [drive, setDrive] = useState<"all" | "electric" | "diesel" | "manual">("all");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [sort, setSort] = useState<Sort>("relevance");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const lo = min ? Number(min) : 0;
    const hi = max ? Number(max) : Infinity;
    const list = products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (brand !== "all" && p.brand !== brand) return false;
      if (condition !== "all" && p.condition !== condition) return false;
      if (drive !== "all" && p.drive !== drive) return false;
      if (p.price < lo || p.price > hi) return false;
      if (needle) {
        const hay = [p.title.nl, p.title.en, p.brand, p.model, p.article, p.kind.nl, p.kind.en].join(" ").toLowerCase();
        if (!needle.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    });
    const by: Record<Sort, (a: (typeof list)[number], b: (typeof list)[number]) => number> = {
      relevance: () => 0, // server already orders featured-first, newest-first
      priceAsc: (a, b) => a.price - b.price,
      priceDesc: (a, b) => b.price - a.price,
      yearDesc: (a, b) => (b.year ?? 0) - (a.year ?? 0),
      hoursAsc: (a, b) => (a.hours ?? Infinity) - (b.hours ?? Infinity),
    };
    return [...list].sort(by[sort]);
  }, [products, q, category, brand, condition, drive, min, max, sort]);

  const activeCount =
    (brand !== "all" ? 1 : 0) + (condition !== "all" ? 1 : 0) + (drive !== "all" ? 1 : 0) + (min || max ? 1 : 0);

  const reset = () => {
    setQ("");
    setCategory("all");
    setBrand("all");
    setCondition("all");
    setDrive("all");
    setMin("");
    setMax("");
    setSort("relevance");
  };

  const changeCategory = (c: CategoryId | "all") => {
    setCategory(c);
    const url = new URL(window.location.href);
    if (c === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", c);
    window.history.replaceState(null, "", url);
  };

  const count = (c: CategoryId | "all") => (c === "all" ? products.length : products.filter((p) => p.category === c).length);

  const select =
    "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm font-medium focus:border-accent";

  return (
    <div>
      {/* category chips */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {(["all", ...categoryIds] as const).map((c) => (
          <button key={c} type="button" onClick={() => changeCategory(c)} className={`${chip(category === c)} shrink-0`}>
            {dict.categories[c]} <span className="ml-1 opacity-70">{count(c)}</span>
          </button>
        ))}
      </div>

      {/* toolbar */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={dict.products.search}
            aria-label={dict.products.search}
            className="w-full rounded-full border border-line bg-surface py-3 pr-4 pl-11 text-sm font-medium focus:border-accent"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          aria-expanded={showFilters}
          className={`${chip(showFilters || activeCount > 0)} inline-flex items-center gap-2`}
        >
          <SlidersHorizontal className="size-4" /> {dict.products.filters}
          {activeCount > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-accent text-[11px] text-black">{activeCount}</span>
          )}
        </button>
        <label className="flex items-center gap-2 text-sm font-semibold text-muted">
          <span className="sr-only sm:not-sr-only">{dict.products.sort}</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={`${select} !w-auto`}>
            {Object.entries(dict.products.sortOptions).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <div className="hidden rounded-full border border-line bg-surface p-1 sm:flex" role="group">
          {(
            [
              ["grid", LayoutGrid, dict.products.gridView],
              ["list", List, dict.products.listView],
            ] as const
          ).map(([v, Icon, label]) => (
            <button
              key={v}
              type="button"
              aria-label={label}
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`grid size-9 place-items-center rounded-full transition ${
                view === v ? "bg-brand-gradient text-white" : "text-muted hover:text-ink"
              }`}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>

      {/* filter panel */}
      <AnimatePresence initial={false}>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-surface border-line mt-4 grid gap-5 rounded-xl border p-5 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block text-sm font-bold">
                {dict.products.brand}
                <select value={brand} onChange={(e) => setBrand(e.target.value)} className={`${select} mt-2`}>
                  <option value="all">{dict.products.allBrands}</option>
                  {brands.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </label>
              <div>
                <p className="mb-2 text-sm font-bold">{dict.products.condition}</p>
                <div className="flex flex-wrap gap-2">
                  {(["all", "used", "new"] as const).map((c) => (
                    <button key={c} type="button" onClick={() => setCondition(c)} className={chip(condition === c)}>
                      {c === "all" ? dict.categories.all : dict.condition[c]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-bold">{dict.products.drive}</p>
                <div className="flex flex-wrap gap-2">
                  {(["all", "electric", "diesel", "manual"] as const).map((d) => (
                    <button key={d} type="button" onClick={() => setDrive(d)} className={chip(drive === d)}>
                      {d === "all" ? dict.categories.all : dict.drive[d]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-bold">
                  {dict.products.price} <span className="font-normal text-muted">({dict.common.exclVat})</span>
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={maxPrice}
                    value={min}
                    onChange={(e) => setMin(e.target.value)}
                    placeholder={dict.products.minPrice}
                    aria-label={dict.products.minPrice}
                    className={select}
                  />
                  <span className="text-muted">–</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={max}
                    onChange={(e) => setMax(e.target.value)}
                    placeholder={dict.products.maxPrice}
                    aria-label={dict.products.maxPrice}
                    className={select}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 flex items-center justify-between text-sm font-semibold text-muted" aria-live="polite">
        <span>{filtered.length === 1 ? dict.products.resultsOne : fmt(dict.products.results, { n: filtered.length })}</span>
        {(activeCount > 0 || q || category !== "all") && (
          <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-brand-2 hover:underline">
            <X className="size-4" /> {dict.products.reset}
          </button>
        )}
      </div>

      <motion.div
        layout
        className={`mt-4 grid gap-5 ${view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} layout={view} priority={i < 3} />
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <div className="bg-surface border-line mt-8 rounded-xl border border-dashed p-12 text-center">
          <p className="text-xl font-bold">{dict.products.none}</p>
          <p className="mx-auto mt-2 max-w-md text-muted">{dict.products.noneHint}</p>
          <button type="button" onClick={reset} className={`${chip(true)} mt-6`}>
            {dict.products.reset}
          </button>
        </div>
      )}
    </div>
  );
}
