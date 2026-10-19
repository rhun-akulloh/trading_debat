import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/nl/cart", "/en/cart", "/nl/checkout", "/en/checkout"] }],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
