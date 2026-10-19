// Postgres-backed store. Deliberately free of framework imports so the SQL can be tested in isolation.
import type { Product } from "./products";
import type { Store } from "./store-types";

export type Query = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

type Row = { id: string; slug: string; status: Product["status"]; data: Omit<Product, "id" | "slug" | "status"> };

const toProduct = (r: Row): Product => ({ ...r.data, id: r.id, slug: r.slug, status: r.status }) as Product;

function split(p: Product) {
  const { id, slug, status, ...data } = p;
  return { id, slug, status, data };
}

export function createPgStore(query: Query, seed: Product[]): Store {
  let ready: Promise<void> | null = null;

  const ensure = () =>
    (ready ??= (async () => {
      await query(`create table if not exists products (
        id text primary key,
        slug text unique not null,
        status text not null default 'published',
        data jsonb not null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )`);
      await query(`create table if not exists meta (key text primary key, value text)`);
      // Exactly one caller wins this insert, so the starter catalog is only ever loaded once —
      // deleting every product later must not bring them back.
      const claimed = await query(`insert into meta (key, value) values ('seeded', now()::text) on conflict do nothing returning key`);
      if (claimed.length) {
        for (const p of seed) {
          const { id, slug, status, data } = split(p);
          await query(
            `insert into products (id, slug, status, data) values ($1, $2, $3, $4::jsonb) on conflict do nothing`,
            [id, slug, status, JSON.stringify(data)],
          );
        }
      }
    })().catch((e) => {
      ready = null; // allow a retry on the next request
      throw e;
    }));

  return {
    kind: "postgres",
    writable: true,
    async listAll() {
      await ensure();
      const rows = (await query(`select id, slug, status, data from products`)) as unknown as Row[];
      return rows.map(toProduct);
    },
    async getById(id) {
      await ensure();
      const rows = (await query(`select id, slug, status, data from products where id = $1`, [id])) as unknown as Row[];
      return rows[0] ? toProduct(rows[0]) : undefined;
    },
    async save(p) {
      await ensure();
      const { id, slug, status, data } = split(p);
      await query(
        `insert into products (id, slug, status, data) values ($1, $2, $3, $4::jsonb)
         on conflict (id) do update set slug = excluded.slug, status = excluded.status, data = excluded.data, updated_at = now()`,
        [id, slug, status, JSON.stringify(data)],
      );
    },
    async remove(id) {
      await ensure();
      await query(`delete from products where id = $1`, [id]);
    },
  };
}
