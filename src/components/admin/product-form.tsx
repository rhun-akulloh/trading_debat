"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Save, Trash2 } from "lucide-react";
import { deleteProduct, saveProduct, type ProductInput } from "@/app/admin/actions";
import { fmt } from "@/lib/i18n";
import type { Product } from "@/lib/products";
import { ImageManager } from "./image-manager";
import { useAdmin } from "./admin-i18n-provider";

const numStr = (n?: number) => (n === undefined || n === null ? "" : String(n));
const toNum = (s: string) => {
  const t = s.trim().replace(",", ".");
  return t === "" || Number.isNaN(Number(t)) ? null : Math.round(Number(t));
};

type Form = {
  titleNl: string; titleEn: string; category: Product["category"]; condition: "new" | "used"; status: Product["status"];
  featured: boolean; brand: string; model: string; article: string; price: string;
  year: string; hours: string; capacityKg: string; liftHeightMm: string; forkLengthMm: string; forkWidthMm: string;
  clearanceMm: string; weightKg: string; batteryV: string; truckWidthMm: string;
  drive: "" | "electric" | "diesel" | "manual"; mast: "" | "duplex" | "triplex"; freeLift: boolean; sideShift: boolean;
  lengthCm: string; heightCm: string; pocketCm: string; featuresNl: string; featuresEn: string; images: string[];
};

function initialState(p: Product | undefined, nextArticle: string): Form {
  return {
    titleNl: p?.title.nl ?? "", titleEn: p && p.title.en !== p.title.nl ? p.title.en : "",
    category: p?.category ?? "heftrucks", condition: p?.condition ?? "used", status: p?.status ?? "published",
    featured: !!p?.featured, brand: p?.brand ?? "", model: p?.model ?? "", article: p?.article ?? nextArticle, price: numStr(p?.price),
    year: numStr(p?.year), hours: numStr(p?.hours), capacityKg: numStr(p?.capacityKg), liftHeightMm: numStr(p?.liftHeightMm),
    forkLengthMm: numStr(p?.forkLengthMm), forkWidthMm: numStr(p?.forkWidthMm), clearanceMm: numStr(p?.clearanceMm),
    weightKg: numStr(p?.weightKg), batteryV: numStr(p?.batteryV), truckWidthMm: numStr(p?.truckWidthMm),
    drive: p?.drive ?? "", mast: p?.mast ?? "", freeLift: !!p?.freeLift, sideShift: !!p?.sideShift,
    lengthCm: numStr(p?.lengthCm), heightCm: numStr(p?.heightCm), pocketCm: p?.pocketCm ?? "",
    featuresNl: p?.features.nl.join("\n") ?? "",
    featuresEn: p && p.features.en.join("\n") !== p.features.nl.join("\n") ? p.features.en.join("\n") : "",
    images: p?.images ?? [],
  };
}

const inputCls = "w-full rounded-xl border border-line bg-surface px-4 py-3 text-[15px] font-medium outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/15";

function Label({ text, hint, required, children }: { text: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-bold">
      {text}
      {required && <span className="text-brand-2"> *</span>}
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface border-line shadow-card rounded-xl border p-6 sm:p-7">
      <h2 className="mb-5 text-lg font-extrabold">{title}</h2>
      {children}
    </section>
  );
}

export function ProductForm({ product, nextArticle }: { product?: Product; nextArticle: string }) {
  const router = useRouter();
  const { t } = useAdmin();
  const [f, setF] = useState(() => initialState(product, nextArticle));
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const uid = useId();

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));
  const text = (k: keyof Form) => ({ value: f[k] as string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value as never) });
  const isAttachment = f.category === "voorzetapparatuur";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const input: ProductInput = {
      id: product?.id, titleNl: f.titleNl, titleEn: f.titleEn, category: f.category, condition: f.condition, status: f.status,
      featured: f.featured, brand: f.brand, model: f.model, article: f.article, price: toNum(f.price) ?? NaN,
      year: toNum(f.year), hours: toNum(f.hours), capacityKg: toNum(f.capacityKg), liftHeightMm: toNum(f.liftHeightMm),
      forkLengthMm: toNum(f.forkLengthMm), forkWidthMm: toNum(f.forkWidthMm), clearanceMm: toNum(f.clearanceMm),
      weightKg: toNum(f.weightKg), batteryV: toNum(f.batteryV), truckWidthMm: toNum(f.truckWidthMm),
      drive: f.drive || null, mast: f.mast || null, freeLift: f.freeLift, sideShift: f.sideShift,
      lengthCm: toNum(f.lengthCm), heightCm: toNum(f.heightCm), pocketCm: f.pocketCm,
      featuresNl: f.featuresNl, featuresEn: f.featuresEn, images: f.images,
    };
    if (Number.isNaN(input.price)) return setError(t.form.priceInvalid);
    start(async () => {
      const res = await saveProduct(input);
      if (!res.ok) return setError(res.error);
      router.push("/admin");
      router.refresh();
    });
  };

  const remove = () => {
    if (!product || !confirm(fmt(t.form.confirmDelete, { title: product.title.nl }))) return;
    start(async () => {
      const res = await deleteProduct(product.id);
      if (!res.ok) return setError(res.error);
      router.push("/admin");
      router.refresh();
    });
  };

  const driveOptions = f.category === "heftrucks" ? ["electric", "diesel"] : f.category === "palletwagens" ? ["electric", "manual"] : [];

  return (
    <form onSubmit={submit} className="space-y-6" id={uid}>
      <Section title={t.form.photos}>
        <ImageManager images={f.images} onChange={(v) => set("images", v)} />
      </Section>

      <Section title={t.form.basics}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label text={t.form.titleNl} required hint={t.form.titleNlHint}>
              <input {...text("titleNl")} required maxLength={150} className={inputCls} />
            </Label>
          </div>
          <div className="sm:col-span-2">
            <Label text={t.form.titleEn} hint={t.form.titleEnHint}>
              <input {...text("titleEn")} maxLength={150} className={inputCls} />
            </Label>
          </div>
          <Label text={t.form.category} required>
            <select value={f.category} onChange={(e) => { set("category", e.target.value as Form["category"]); set("drive", ""); }} className={inputCls}>
              <option value="heftrucks">{t.category.heftrucks}</option>
              <option value="stapelaars">{t.category.stapelaars}</option>
              <option value="palletwagens">{t.category.palletwagens}</option>
              <option value="voorzetapparatuur">{t.category.voorzetapparatuur}</option>
            </select>
          </Label>
          <Label text={t.form.condition} required>
            <select {...text("condition")} className={inputCls}>
              <option value="used">{t.condition.used}</option>
              <option value="new">{t.condition.new}</option>
            </select>
          </Label>
          <Label text={t.form.brand}><input {...text("brand")} maxLength={60} className={inputCls} /></Label>
          <Label text={t.form.model}><input {...text("model")} maxLength={60} className={inputCls} /></Label>
          <Label text={t.form.article} required><input {...text("article")} required maxLength={20} className={inputCls} /></Label>
          <Label text={t.form.price} required><input {...text("price")} required inputMode="numeric" placeholder="2950" className={inputCls} /></Label>
          <Label text={t.form.status} hint={t.form.statusHint}>
            <select {...text("status")} className={inputCls}>
              <option value="published">{t.status.published}</option>
              <option value="sold">{t.status.sold}</option>
              <option value="hidden">{t.status.hidden}</option>
            </select>
          </Label>
          <label className="flex items-center gap-3 self-end rounded-xl border border-line bg-surface px-4 py-3 font-semibold">
            <input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} className="size-5 accent-[var(--accent)]" />
            {t.form.featuredCheck}
          </label>
        </div>
      </Section>

      <Section title={t.form.specs}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Label text={t.form.year}><input {...text("year")} inputMode="numeric" className={inputCls} /></Label>
          <Label text={t.form.hours}><input {...text("hours")} inputMode="numeric" className={inputCls} /></Label>
          {!isAttachment && <Label text={t.form.capacity}><input {...text("capacityKg")} inputMode="numeric" className={inputCls} /></Label>}
          {!isAttachment && <Label text={t.form.liftHeight}><input {...text("liftHeightMm")} inputMode="numeric" className={inputCls} /></Label>}
          {!isAttachment && <Label text={t.form.forkLength}><input {...text("forkLengthMm")} inputMode="numeric" className={inputCls} /></Label>}
          {!isAttachment && <Label text={t.form.forkWidth}><input {...text("forkWidthMm")} inputMode="numeric" className={inputCls} /></Label>}
          {!isAttachment && <Label text={t.form.clearance}><input {...text("clearanceMm")} inputMode="numeric" className={inputCls} /></Label>}
          {!isAttachment && <Label text={t.form.weight}><input {...text("weightKg")} inputMode="numeric" className={inputCls} /></Label>}
          {!isAttachment && <Label text={t.form.battery}><input {...text("batteryV")} inputMode="numeric" className={inputCls} /></Label>}
          {f.category === "heftrucks" && <Label text={t.form.truckWidth}><input {...text("truckWidthMm")} inputMode="numeric" className={inputCls} /></Label>}
          {driveOptions.length > 0 && (
            <Label text={t.form.drive}>
              <select {...text("drive")} className={inputCls}>
                <option value="">{t.form.driveDefault}</option>
                {driveOptions.map((d) => <option key={d} value={d}>{t.form.drives[d as keyof typeof t.form.drives]}</option>)}
              </select>
            </Label>
          )}
          {(f.category === "heftrucks" || f.category === "stapelaars") && (
            <Label text={t.form.mast}>
              <select {...text("mast")} className={inputCls}>
                <option value="">{t.form.mastNone}</option>
                <option value="duplex">{t.form.masts.duplex}</option>
                <option value="triplex">{t.form.masts.triplex}</option>
              </select>
            </Label>
          )}
          {isAttachment && <Label text={t.form.length}><input {...text("lengthCm")} inputMode="numeric" className={inputCls} /></Label>}
          {isAttachment && <Label text={t.form.height}><input {...text("heightCm")} inputMode="numeric" className={inputCls} /></Label>}
          {isAttachment && <Label text={t.form.pockets}><input {...text("pocketCm")} placeholder="13 x 6" className={inputCls} /></Label>}
          {f.category === "heftrucks" && (
            <div className="flex flex-wrap items-end gap-3 sm:col-span-2 lg:col-span-3">
              <label className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 font-semibold">
                <input type="checkbox" checked={f.freeLift} onChange={(e) => set("freeLift", e.target.checked)} className="size-5 accent-[var(--accent)]" /> {t.form.freeLift}
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 font-semibold">
                <input type="checkbox" checked={f.sideShift} onChange={(e) => set("sideShift", e.target.checked)} className="size-5 accent-[var(--accent)]" /> {t.form.sideShift}
              </label>
            </div>
          )}
        </div>
      </Section>

      <Section title={t.form.features}>
        <div className="grid gap-5 lg:grid-cols-2">
          <Label text={t.form.featuresNl} hint={t.form.featuresNlHint}>
            <textarea {...text("featuresNl")} rows={6} className={`${inputCls} resize-y`} />
          </Label>
          <Label text={t.form.featuresEn} hint={t.form.featuresEnHint}>
            <textarea {...text("featuresEn")} rows={6} className={`${inputCls} resize-y`} />
          </Label>
        </div>
      </Section>

      <div className="glass border-line sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 shadow-lift">
        <div className="flex items-center gap-2">
          <button type="submit" disabled={pending} className="bg-accent-gradient inline-flex items-center gap-2 rounded-full px-7 py-3 font-bold text-[#0b1f1d] shadow-md disabled:opacity-60">
            <Save className="size-4" /> {pending ? t.form.saving : t.form.save}
          </button>
          <Link href="/admin" className="rounded-full px-5 py-3 font-semibold text-muted hover:text-ink">{t.common.cancel}</Link>
        </div>
        {product && (
          <button type="button" onClick={remove} disabled={pending} className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-500/10 disabled:opacity-60">
            <Trash2 className="size-4" /> {t.form.delete}
          </button>
        )}
        {error && <p role="alert" className="w-full rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-500">{error}</p>}
      </div>
    </form>
  );
}
