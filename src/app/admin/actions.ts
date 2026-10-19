"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkCredentials, endSession, requireAdmin, startSession } from "@/lib/auth";
import { deleteImages, isAllowedImageUrl } from "@/lib/images";
import { categoryIds, deriveKind, slugify, type Product, type Status } from "@/lib/products";
import { clientIp, rateLimited } from "@/lib/rate-limit";
import { getStore, listAll } from "@/lib/store";
import { getAdminDict } from "@/lib/admin-lang";
import { fmt } from "@/lib/i18n";
import type { AdminDict } from "@/lib/admin-i18n";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

/** Public pages are cached; after any change throw the cache away so visitors see it immediately. */
function refreshSite() {
  revalidatePath("/", "layout");
  revalidatePath("/[lang]", "layout");
}

// ───────────── login / logout ─────────────

export async function login(_prev: { error?: "wrong" | "tooMany"; email?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const ip = clientIp(new Request("http://x", { headers: await headers() }));
  if (rateLimited(`login:${ip}`, 8, 15 * 60_000)) return { error: "tooMany" as const, email };

  const who = checkCredentials(email, String(formData.get("password") ?? ""));
  if (!who) return { error: "wrong" as const, email };

  await startSession(who);
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

// ───────────── products ─────────────

const num = z.number().int().min(0).max(10_000_000).nullish();
const str = (max: number) => z.string().trim().max(max);

const inputSchema = z.object({
  id: z.string().optional(),
  titleNl: str(150).min(1, "titleRequired"),
  titleEn: str(150).optional(),
  category: z.enum(categoryIds as [string, ...string[]]),
  condition: z.enum(["new", "used"]),
  status: z.enum(["published", "hidden", "sold"]),
  featured: z.boolean(),
  brand: str(60).optional(),
  model: str(60).optional(),
  article: str(20).min(1, "articleRequired"),
  price: z.number().int().min(0, "priceRequired").max(10_000_000),
  year: z.number().int().min(1950).max(2100).nullish(),
  hours: num,
  capacityKg: num,
  liftHeightMm: num,
  forkLengthMm: num,
  forkWidthMm: num,
  clearanceMm: num,
  weightKg: num,
  batteryV: num,
  truckWidthMm: num,
  drive: z.enum(["electric", "diesel", "manual"]).nullish(),
  mast: z.enum(["duplex", "triplex"]).nullish(),
  freeLift: z.boolean(),
  sideShift: z.boolean(),
  lengthCm: num,
  heightCm: num,
  pocketCm: str(30).optional(),
  featuresNl: str(4000),
  featuresEn: str(4000),
  images: z.array(z.string().max(500)).min(1, "imageRequired").max(30),
});
export type ProductInput = z.input<typeof inputSchema>;

/** Our own messages are codes (see admin-i18n); anything else (zod's English defaults) becomes a clear sentence. */
function describeIssue(issue: z.core.$ZodIssue | undefined, t: AdminDict) {
  if (!issue) return t.err.check;
  const known = ["titleRequired", "articleRequired", "priceRequired", "imageRequired"] as const;
  const code = known.find((k) => k === issue.message);
  if (code) return t.err[code];
  const key = String(issue.path[0]) as keyof AdminDict["err"]["fields"];
  return fmt(t.err.fieldInvalid, { field: t.err.fields[key] ?? t.err.fields.other });
}

const lines = (s: string) => s.split("\n").map((l) => l.trim().replace(/^[-•*]\s*/, "")).filter(Boolean);
const opt = <T,>(v: T | null | undefined) => (v === null || v === undefined || (v as unknown) === "" ? undefined : v);

export async function saveProduct(raw: ProductInput): Promise<ActionResult> {
  await requireAdmin();
  const { t } = await getAdminDict();
  const store = getStore();
  if (!store.writable) return { ok: false, error: t.err.noDb };

  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: describeIssue(parsed.error.issues[0], t) };
  const d = parsed.data;
  if (!d.images.every(isAllowedImageUrl)) return { ok: false, error: t.err.invalidPhotoUrl };

  const all = await listAll();
  if (all.some((p) => p.article === d.article && p.id !== d.id)) {
    return { ok: false, error: fmt(t.err.articleInUse, { article: d.article }) };
  }

  const existing = d.id ? all.find((p) => p.id === d.id) : undefined;
  if (d.id && !existing) return { ok: false, error: t.err.notExist };

  const category = d.category as Product["category"];
  const drive = category === "stapelaars" ? "electric" : (opt(d.drive) ?? (category === "heftrucks" || category === "palletwagens" ? "electric" : undefined));
  const titleNl = d.titleNl;

  // The address of a product never changes after creation, so shared links keep working.
  let slug = existing?.slug;
  if (!slug) {
    const base = slugify(`${titleNl}-${d.article}`) || `product-${d.article}`;
    slug = base;
    for (let n = 2; all.some((p) => p.slug === slug); n++) slug = `${base}-${n}`;
  }

  const product: Product = {
    id: existing?.id ?? crypto.randomUUID().slice(0, 12),
    slug,
    status: d.status,
    featured: d.featured || undefined,
    article: d.article,
    category,
    condition: d.condition,
    brand: opt(d.brand),
    model: opt(d.model),
    title: { nl: titleNl, en: opt(d.titleEn) ?? titleNl },
    kind: deriveKind(category, drive),
    price: d.price,
    year: opt(d.year),
    hours: opt(d.hours),
    capacityKg: opt(d.capacityKg),
    liftHeightMm: opt(d.liftHeightMm),
    forkLengthMm: opt(d.forkLengthMm),
    forkWidthMm: opt(d.forkWidthMm),
    clearanceMm: opt(d.clearanceMm),
    weightKg: opt(d.weightKg),
    batteryV: opt(d.batteryV),
    truckWidthMm: opt(d.truckWidthMm),
    drive,
    mast: opt(d.mast),
    freeLift: d.freeLift || undefined,
    sideShift: d.sideShift || undefined,
    lengthCm: category === "voorzetapparatuur" ? opt(d.lengthCm) : undefined,
    heightCm: category === "voorzetapparatuur" ? opt(d.heightCm) : undefined,
    pocketCm: category === "voorzetapparatuur" ? opt(d.pocketCm) : undefined,
    features: { nl: lines(d.featuresNl), en: lines(d.featuresEn).length ? lines(d.featuresEn) : lines(d.featuresNl) },
    images: d.images,
  };
  // drop undefined so the stored JSON stays tidy
  const clean = JSON.parse(JSON.stringify(product)) as Product;

  try {
    await store.save(clean);
  } catch (e) {
    console.error("[admin] save failed", e);
    return { ok: false, error: t.err.saveFailed };
  }
  if (existing) await deleteImages(existing.images.filter((u) => !clean.images.includes(u)));
  refreshSite();
  return { ok: true, id: clean.id };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin();
  const { t } = await getAdminDict();
  const store = getStore();
  if (!store.writable) return { ok: false, error: t.err.noDbShort };
  const existing = await store.getById(id);
  if (!existing) return { ok: false, error: t.err.notExist };
  await store.remove(id);
  await deleteImages(existing.images);
  refreshSite();
  return { ok: true };
}

export async function setStatus(id: string, status: Status): Promise<ActionResult> {
  await requireAdmin();
  const { t } = await getAdminDict();
  if (!["published", "hidden", "sold"].includes(status)) return { ok: false, error: t.err.invalidStatus };
  const store = getStore();
  if (!store.writable) return { ok: false, error: t.err.noDbShort };
  const p = await store.getById(id);
  if (!p) return { ok: false, error: t.err.notExist };
  await store.save({ ...p, status });
  refreshSite();
  return { ok: true };
}
