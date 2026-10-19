"use client";

import { createContext, useContext } from "react";
import type { Dict } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";

const Ctx = createContext<{ locale: Locale; dict: Dict } | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dict;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={{ locale, dict }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside <I18nProvider>");
  return v;
}
