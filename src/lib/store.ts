import "server-only";
import { cache } from "react";
import { neon } from "@neondatabase/serverless";
import seed from "@/data/products.json";
import type { Product } from "./products";
import type { Store } from "./store-types";
import { createPgStore } from "./store-pg";
import { createFileStore } from "./store-file";
import { databaseUrl } from "./env";

const seedProducts = seed as Product[];

let store: Store | undefined;

/**
 * DATABASE_URL set  → Neon Postgres (production)
 * otherwise, dev    → editable JSON file in .data/ (so everything works with zero setup;
 *                       PRODUCT_STORE=file does the same on a single server with a persistent disk)
 * otherwise, prod   → read-only starter catalog; the admin says the database is missing
 */
export function getStore(): Store {
  if (store) return store;
  const url = databaseUrl();
  if (url) {
    const sql = neon(url);
    store = createPgStore((text, params) => sql.query(text, params ?? []) as Promise<Record<string, unknown>[]>, seedProducts);
  } else {
    store = createFileStore(seedProducts, process.env.NODE_ENV !== "production" || process.env.PRODUCT_STORE === "file");
  }
  return store;
}

const byNewest = (a: Product, b: Product) =>
  Number(!!b.featured) - Number(!!a.featured) || (parseInt(b.article, 10) || 0) - (parseInt(a.article, 10) || 0);

/**
 * Deduplicated per request, so a page can call these freely.
 *
 * While *building*, a database that can't be reached (wrong URL, paused, first deploy) must not fail the
 * whole deploy — pages are pre-rendered from the bundled starter catalog instead and refresh from the real
 * database within a minute (ISR). At runtime errors are NOT swallowed, so a broken database is never hidden.
 */
export const listAll = cache(async () => {
  try {
    return [...(await getStore().listAll())].sort(byNewest);
  } catch (e) {
    if (process.env.NEXT_PHASE !== "phase-production-build") throw e;
    const cause = e instanceof Error && e.cause instanceof Error ? ` (${e.cause.message})` : "";
    console.warn(`[store] database unreachable during build, pre-rendering with the starter catalog: ${e instanceof Error ? e.message.slice(0, 160) : e}${cause}`);
    return [...seedProducts].sort(byNewest);
  }
});

/** What visitors see: for sale or sold, never hidden. */
export const listPublic = cache(async () => (await listAll()).filter((p) => p.status !== "hidden"));

export async function getPublicBySlug(slug: string) {
  return (await listPublic()).find((p) => p.slug === slug);
}

/** Only machines that can actually be ordered. */
export async function getOrderableByIds(ids: string[]) {
  const all = await listPublic();
  return ids.map((id) => all.find((p) => p.id === id && p.status === "published"));
}
