import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, locales } from "@/lib/i18n";

function pickLocale(request: NextRequest) {
  const saved = request.cookies.get("lang")?.value;
  if (saved && hasLocale(saved)) return saved;
  const header = request.headers.get("accept-language") ?? "";
  for (const part of header.split(",")) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (hasLocale(code)) return code;
  }
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasPrefix = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasPrefix) return;

  const url = request.nextUrl.clone();
  url.pathname = `/${pickLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, API routes, the admin area and any file with an extension (images, icons, robots, sitemap…)
  matcher: ["/((?!_next|api|admin|.*\\..*).*)"],
};
