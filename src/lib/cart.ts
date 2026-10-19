"use client";

import { useSyncExternalStore } from "react";

// Every machine is a unique unit, so the cart is just a list of product ids.
const KEY = "dbt-cart";
const EMPTY: string[] = [];
let ids: string[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (Array.isArray(parsed)) ids = parsed.filter((x) => typeof x === "string");
  } catch {
    ids = EMPTY;
  }
}

function commit(next: string[]) {
  ids = next.length ? next : EMPTY;
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  load();
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

const getSnapshot = () => {
  load();
  return ids;
};
const getServerSnapshot = () => EMPTY;

export const cartActions = {
  add: (id: string) => {
    load();
    if (!ids.includes(id)) commit([...ids, id]);
  },
  remove: (id: string) => {
    load();
    commit(ids.filter((x) => x !== id));
  },
  clear: () => commit([]),
};

export function useCartIds() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
