import Link from "next/link";
import { Mail, MapPin, Phone, Share2 } from "lucide-react";
import { Logo } from "./logo";
import type { Dict } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { categoryIds } from "@/lib/products";
import { fullAddress, mapsLinkUrl, site } from "@/lib/site";

export function Footer({ locale, dict }: { locale: Locale; dict: Dict }) {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-brand-gradient relative mt-24 overflow-hidden text-white">
      <div className="hazard h-1.5" />
      <div className="mesh opacity-40">
        <i className="-top-24 right-0 size-96 bg-accent/60" />
        <i className="bottom-0 -left-20 size-80 bg-brand-2/70" style={{ animationDelay: "-8s" }} />
      </div>
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)]">
        <div>
          <Logo light />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/70">{dict.footer.tagline}</p>
          <p className="mt-4 inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80">
            {dict.footer.b2b}
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold tracking-widest text-accent-2 uppercase">{dict.footer.explore}</h3>
          <ul className="space-y-2.5 text-sm text-white/80">
            <li>
              <Link className="hover:text-white" href={`/${locale}/products`}>
                {dict.categories.all}
              </Link>
            </li>
            {categoryIds.map((c) => (
              <li key={c}>
                <Link className="hover:text-white" href={`/${locale}/products?category=${c}`}>
                  {dict.categories[c]}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold tracking-widest text-accent-2 uppercase">{dict.footer.company}</h3>
          <ul className="space-y-2.5 text-sm text-white/80">
            <li>
              <Link className="hover:text-white" href={`/${locale}/sell`}>
                {dict.nav.sell}
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" href={`/${locale}/contact`}>
                {dict.nav.contact}
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" href={`/${locale}/terms`}>
                {dict.terms.title}
              </Link>
            </li>
            <li>
              <a className="inline-flex items-center gap-2 hover:text-white" href={site.facebook} target="_blank" rel="noopener noreferrer">
                <Share2 className="size-4" /> Facebook
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold tracking-widest text-accent-2 uppercase">{dict.footer.contact}</h3>
          <ul className="space-y-3 text-sm text-white/80">
            <li className="font-semibold text-white">{site.owner}</li>
            <li>
              <a className="inline-flex items-center gap-2.5 hover:text-white" href={`tel:${site.phoneHref}`}>
                <Phone className="size-4 text-accent-2" /> {site.phone}
              </a>
            </li>
            <li>
              <a className="inline-flex items-center gap-2.5 hover:text-white" href={`mailto:${site.email}`}>
                <Mail className="size-4 text-accent-2" /> {site.email}
              </a>
            </li>
            <li>
              <a className="inline-flex items-start gap-2.5 hover:text-white" href={mapsLinkUrl} target="_blank" rel="noopener noreferrer">
                <MapPin className="mt-0.5 size-4 shrink-0 text-accent-2" /> {fullAddress}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-white/60 sm:flex-row sm:justify-between sm:px-6">
          <span>
            © {year} {site.name}. {dict.footer.rights}
          </span>
          <span>
            KVK {site.kvk} · IBAN {site.iban}
          </span>
        </div>
      </div>
    </footer>
  );
}
