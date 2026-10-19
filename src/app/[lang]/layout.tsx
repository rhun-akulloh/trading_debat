import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import "../globals.css";
import { getDictionary } from "@/dictionaries";
import { hasLocale, locales } from "@/lib/i18n";
import { site } from "@/lib/site";
import { I18nProvider } from "@/components/i18n-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

// Self-hosted (from node_modules) so the build never depends on fetching Google Fonts.
const body = localFont({
  src: "../../../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2",
  weight: "100 1000",
  variable: "--font-body",
  display: "swap",
});
const heading = localFont({
  src: "../../../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2",
  weight: "200 800",
  variable: "--font-heading",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0b1f1d" },
    { media: "(prefers-color-scheme: dark)", color: "#06130f" },
  ],
};

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    metadataBase: new URL(site.url),
    title: { default: dict.meta.title, template: `%s · ${site.name}` },
    description: dict.meta.description,
    alternates: { languages: { nl: "/nl", en: "/en" } },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      siteName: site.name,
      locale: lang === "nl" ? "nl_NL" : "en_GB",
      type: "website",
    },
  };
}

// Runs before first paint so there is no light/dark flash.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <html lang={lang} className={`${body.variable} ${heading.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        {/* Server-only: React 19 warns about <script> tags rendered on the client. The browser has already run it from the initial HTML. */}
        {typeof window === "undefined" && <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeScript }} />}
        <I18nProvider locale={lang} dict={dict}>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer locale={lang} dict={dict} />
        </I18nProvider>
      </body>
    </html>
  );
}
