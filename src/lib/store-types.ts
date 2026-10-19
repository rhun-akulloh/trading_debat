import type { Product } from "./products";

/** Everything the app needs from product storage. Small on purpose: the catalog is a few dozen rows. */
export interface Store {
  kind: "postgres" | "file" | "readonly";
  writable: boolean;
  /** Every product, including hidden ones. Callers filter for the public site. */
  listAll(): Promise<Product[]>;
  getById(id: string): Promise<Product | undefined>;
  save(p: Product): Promise<void>;
  remove(id: string): Promise<void>;
}
