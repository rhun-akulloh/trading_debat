import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { listPublic } from "@/lib/store";
import { site } from "@/lib/site";

export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listPublic();
  const pages = ["", "/products", "/sell", "/contact", "/terms"];
  const entries = locales.flatMap((l) => [
    ...pages.map((p) => ({
      url: `${site.url}/${l}${p}`,
      changeFrequency: p === "/products" || p === "" ? ("weekly" as const) : ("monthly" as const),
      priority: p === "" ? 1 : p === "/products" ? 0.9 : 0.6,
      alternates: { languages: Object.fromEntries(locales.map((x) => [x, `${site.url}/${x}${p}`])) },
    })),
    ...products.map((pr) => ({
      url: `${site.url}/${l}/products/${pr.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      alternates: { languages: Object.fromEntries(locales.map((x) => [x, `${site.url}/${x}/products/${pr.slug}`])) },
    })),
  ]);
  return entries;
}
