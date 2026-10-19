"use client";

import { createContext, useContext } from "react";
import { adminDicts, type AdminDict, type AdminLang } from "@/lib/admin-i18n";

const Ctx = createContext<{ lang: AdminLang; t: AdminDict }>({ lang: "nl", t: adminDicts.nl });

export function AdminI18nProvider({ lang, children }: { lang: AdminLang; children: React.ReactNode }) {
  return <Ctx.Provider value={{ lang, t: adminDicts[lang] }}>{children}</Ctx.Provider>;
}

export const useAdmin = () => useContext(Ctx);
