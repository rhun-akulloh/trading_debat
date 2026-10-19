import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail, MapPin, Phone, Share2 } from "lucide-react";
import { getDictionary } from "@/dictionaries";
import { hasLocale } from "@/lib/i18n";
import { fullAddress, mapsEmbedUrl, mapsLinkUrl, site } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { ContactForm } from "@/components/contact-form";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const d = getDictionary(lang);
  return { title: d.contact.title, description: d.contact.subtitle, alternates: { languages: { nl: "/nl/contact", en: "/en/contact" } } };
}

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  const card = "bg-surface border-line shadow-card flex items-start gap-4 rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:border-accent";
  const icon = "bg-brand-gradient grid size-11 shrink-0 place-items-center rounded-xl text-white";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: site.name,
    url: site.url,
    telephone: site.phoneHref,
    email: site.email,
    founder: site.owner,
    vatID: undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      postalCode: site.address.postcode,
      addressLocality: site.address.city,
      addressCountry: site.address.country,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHero title={d.contact.title} subtitle={d.contact.subtitle} eyebrow={site.name} />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div>
            <h2 className="mb-6 text-3xl font-extrabold">{d.contact.formTitle}</h2>
            <p className="mb-6 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4 text-sm font-medium">{d.contact.visitNote}</p>
            <ContactForm kind="contact" />
          </div>

          <aside className="space-y-4">
            <h2 className="mb-2 text-3xl font-extrabold">{d.contact.details}</h2>
            <a href={`tel:${site.phoneHref}`} className={card}>
              <span className={icon}><Phone className="size-5" /></span>
              <span><span className="block text-xs font-bold tracking-wider text-muted uppercase">{d.contact.phone}</span><span className="text-lg font-bold">{site.phone}</span></span>
            </a>
            <a href={`mailto:${site.email}`} className={card}>
              <span className={icon}><Mail className="size-5" /></span>
              <span><span className="block text-xs font-bold tracking-wider text-muted uppercase">{d.contact.email}</span><span className="text-lg font-bold break-all">{site.email}</span></span>
            </a>
            <a href={mapsLinkUrl} target="_blank" rel="noopener noreferrer" className={card}>
              <span className={icon}><MapPin className="size-5" /></span>
              <span><span className="block text-xs font-bold tracking-wider text-muted uppercase">{d.contact.findUs}</span><span className="text-lg font-bold">{fullAddress}</span></span>
            </a>
            <a href={site.facebook} target="_blank" rel="noopener noreferrer" className={card}>
              <span className={icon}><Share2 className="size-5" /></span>
              <span><span className="block text-xs font-bold tracking-wider text-muted uppercase">Facebook</span><span className="text-lg font-bold">{site.owner}</span></span>
            </a>
            <dl className="bg-surface-2 border-line space-y-2 rounded-2xl border p-5 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-muted">{d.contact.owner}</dt><dd className="font-semibold">{site.owner}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">{d.contact.kvk}</dt><dd className="font-semibold">{site.kvk}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">{d.contact.iban}</dt><dd className="font-semibold">{site.iban}</dd></div>
            </dl>
          </aside>
        </div>

        <div className="border-line shadow-card mt-14 overflow-hidden rounded-xl border">
          <iframe
            title={`${d.contact.findUs}: ${fullAddress}`}
            src={mapsEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[380px] w-full border-0"
          />
          <div className="flex items-center justify-between gap-4 bg-surface px-5 py-3 text-sm">
            <span className="font-semibold">{fullAddress}</span>
            <a href={mapsLinkUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-brand-2 hover:underline">
              {d.contact.openMaps}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
