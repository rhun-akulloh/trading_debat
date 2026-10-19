// File-backed store for local development, and a read-only fallback when no database is configured.
import fs from "node:fs/promises";
import path from "node:path";
import type { Product } from "./products";
import type { Store } from "./store-types";

const FILE = path.join(process.cwd(), ".data", "products.json");

export function createFileStore(seed: Product[], writable: boolean): Store {
  // Always hand out a copy: callers sort and push, and must never mutate the shared starter catalog.
  const fresh = () => structuredClone(seed);
  const read = async (): Promise<Product[]> => {
    if (!writable) return fresh();
    try {
      return JSON.parse(await fs.readFile(FILE, "utf8"));
    } catch {
      return fresh();
    }
  };
  const write = async (list: Product[]) => {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(list, null, 2));
  };
  const guard = () => {
    if (!writable) throw new Error("Geen database geconfigureerd (DATABASE_URL ontbreekt).");
  };

  return {
    kind: writable ? "file" : "readonly",
    writable,
    listAll: read,
    async getById(id) {
      return (await read()).find((p) => p.id === id);
    },
    async save(p) {
      guard();
      const list = await read();
      const i = list.findIndex((x) => x.id === p.id);
      if (i >= 0) list[i] = p;
      else list.push(p);
      await write(list);
    },
    async remove(id) {
      guard();
      await write((await read()).filter((p) => p.id !== id));
    },
  };
}
