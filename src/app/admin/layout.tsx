import type { Metadata } from "next";
import { Archivo, DM_Sans } from "next/font/google";
import "../globals.css";
import { getAdminDict } from "@/lib/admin-lang";
import { AdminI18nProvider } from "@/components/admin/admin-i18n-provider";

const body = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const heading = Archivo({ subsets: ["latin"], variable: "--font-heading", display: "swap", weight: ["600", "700", "800", "900"] });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminDict();
  return { title: { default: t.login.title, template: `%s · ${t.login.title}` }, robots: { index: false, follow: false } };
}

// The admin is its own root layout (the public site lives under /[lang]).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { lang } = await getAdminDict();
  return (
    <html lang={lang} className={`${body.variable} ${heading.variable}`}>
      <body className="min-h-screen bg-bg">
        <AdminI18nProvider lang={lang}>{children}</AdminI18nProvider>
      </body>
    </html>
  );
}
