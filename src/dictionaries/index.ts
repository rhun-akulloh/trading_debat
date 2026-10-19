import nl, { type Dict } from "./nl";
import en from "./en";
import type { Locale } from "@/lib/i18n";

const dictionaries: Record<Locale, Dict> = { nl, en };

export const getDictionary = (locale: Locale): Dict => dictionaries[locale];
export type { Dict };
