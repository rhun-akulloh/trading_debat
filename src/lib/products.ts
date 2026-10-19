import type { Locale } from "./i18n";
import type { Dict } from "@/dictionaries";

export type CategoryId = "heftrucks" | "stapelaars" | "palletwagens" | "voorzetapparatuur";
export type Status = "published" | "hidden" | "sold";

export type Product = {
  id: string;
  slug: string;
  /** published = for sale · sold = shown with a "sold" badge · hidden = admin only */
  status: Status;
  featured?: boolean;
  article: string;
  category: CategoryId;
  condition: "new" | "used";
  brand?: string;
  model?: string;
  title: Record<Locale, string>;
  kind: Record<Locale, string>;
  price: number; // excl. VAT, EUR
  year?: number;
  hours?: number;
  capacityKg?: number;
  liftHeightMm?: number;
  forkLengthMm?: number;
  forkWidthMm?: number;
  clearanceMm?: number;
  weightKg?: number;
  batteryV?: number;
  truckWidthMm?: number;
  drive?: "electric" | "diesel" | "manual";
  mast?: "duplex" | "triplex";
  freeLift?: boolean;
  sideShift?: boolean;
  lengthCm?: number;
  heightCm?: number;
  pocketCm?: string;
  features: Record<Locale, string[]>;
  images: string[];
};

export const categoryIds: CategoryId[] = ["heftrucks", "stapelaars", "palletwagens", "voorzetapparatuur"];

export const uniqueBrands = (list: Product[]) =>
  Array.from(new Set(list.map((p) => p.brand).filter(Boolean) as string[])).sort();

export function relatedTo(p: Product, all: Product[], n = 3) {
  const same = all.filter((x) => x.id !== p.id && x.category === p.category);
  const rest = all.filter((x) => x.id !== p.id && x.category !== p.category);
  return [...same, ...rest].slice(0, n);
}

/** The short label shown above a product's title, derived so the owner never has to type it. */
export function deriveKind(category: CategoryId, drive?: Product["drive"]): Record<Locale, string> {
  switch (category) {
    case "heftrucks":
      return drive === "diesel"
        ? { nl: "Dieselheftruck", en: "Diesel forklift" }
        : { nl: "Elektrische heftruck", en: "Electric forklift" };
    case "stapelaars":
      return { nl: "Elektrische stapelaar", en: "Electric stacker" };
    case "palletwagens":
      return drive === "manual"
        ? { nl: "Handmatige palletwagen", en: "Manual pallet truck" }
        : { nl: "Elektrische palletwagen", en: "Electric pallet truck" };
    case "voorzetapparatuur":
      return { nl: "Voorzetapparatuur", en: "Attachment" };
  }
}

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const formatters: Record<Locale, Intl.NumberFormat> = {
  nl: new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }),
  en: new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }),
};
const formattersCents: Record<Locale, Intl.NumberFormat> = {
  nl: new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }),
  en: new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" }),
};
export const formatPrice = (n: number, locale: Locale, cents = false) =>
  (cents ? formattersCents : formatters)[locale].format(n);

export const formatNumber = (n: number, locale: Locale) => n.toLocaleString(locale === "nl" ? "nl-NL" : "en-GB");

export type SpecRow = { label: string; value: string };

/** Human-readable spec rows for the product detail page. */
export function specRows(p: Product, d: Dict, locale: Locale): SpecRow[] {
  const n = (v: number) => formatNumber(v, locale);
  const rows: SpecRow[] = [];
  const add = (label: string, value?: string | number | null) => {
    if (value !== undefined && value !== null && value !== "") rows.push({ label, value: String(value) });
  };
  add(d.specs.article, p.article);
  add(d.specs.brand, p.brand);
  add(d.specs.model, p.model);
  add(d.specs.year, p.year);
  add(d.specs.hours, p.hours !== undefined ? `${n(p.hours)} ${d.common.hours}` : undefined);
  add(d.specs.drive, p.drive ? d.drive[p.drive] : undefined);
  add(d.specs.capacity, p.capacityKg !== undefined ? `${n(p.capacityKg)} kg` : undefined);
  add(d.specs.liftHeight, p.liftHeightMm !== undefined ? `${n(p.liftHeightMm)} mm` : undefined);
  add(d.specs.mast, p.mast ? d.mast[p.mast] : undefined);
  add(d.specs.freeLift, p.freeLift ? d.specs.yes : undefined);
  add(d.specs.sideShift, p.sideShift ? d.specs.yes : undefined);
  add(d.specs.forkLength, p.forkLengthMm !== undefined ? `${n(p.forkLengthMm)} mm` : undefined);
  add(d.specs.forkWidth, p.forkWidthMm !== undefined ? `${n(p.forkWidthMm)} mm` : undefined);
  add(d.specs.clearance, p.clearanceMm !== undefined ? `${n(p.clearanceMm)} mm` : undefined);
  add(d.specs.weight, p.weightKg !== undefined ? `${n(p.weightKg)} kg` : undefined);
  add(d.specs.battery, p.batteryV !== undefined ? `${p.batteryV} V` : undefined);
  add(d.specs.truckWidth, p.truckWidthMm !== undefined ? `${n(p.truckWidthMm)} mm` : undefined);
  add(d.specs.length, p.lengthCm !== undefined ? `${p.lengthCm} cm` : undefined);
  add(d.specs.height, p.heightCm !== undefined ? `${p.heightCm} cm` : undefined);
  add(d.specs.pockets, p.pocketCm ? `${p.pocketCm} cm` : undefined);
  return rows;
}

/** Short chips for product cards. */
export function cardChips(p: Product, d: Dict, locale: Locale): string[] {
  const n = (v: number) => formatNumber(v, locale);
  const chips: string[] = [];
  if (p.year) chips.push(String(p.year));
  if (p.capacityKg) chips.push(`${n(p.capacityKg)} kg`);
  if (p.liftHeightMm && p.category !== "palletwagens") chips.push(`${n(p.liftHeightMm)} mm`);
  if (p.hours !== undefined) chips.push(`${n(p.hours)} ${d.common.hours}`);
  if (p.drive === "diesel") chips.push(d.drive.diesel);
  if (p.drive === "manual") chips.push(d.drive.manual);
  return chips.slice(0, 4);
}
