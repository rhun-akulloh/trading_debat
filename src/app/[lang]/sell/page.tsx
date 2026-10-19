import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Banknote, Truck, Zap } from "lucide-react";
import { getDictionary } from "@/dictionaries";
import { hasLocale } from "@/lib/i18n";
import { site } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { ContactForm } from "@/components/contact-form";

export async function generateMetadata({ params }: PageProps<"/[lang]/sell">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const d = getDictionary(lang);
  return {
    title: d.sell.title,
    description: d.sell.subtitle,
    alternates: { languages: { nl: "/nl/sell", en: "/en/sell" } },
  };
}

export default async function SellPage({ params }: PageProps<"/[lang]/sell">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  const icons = [Banknote, Truck, Zap];

  return (
    <>
      <PageHero title={d.sell.title} subtitle={d.sell.subtitle} eyebrow={d.nav.sell}>
        <ul className="mt-8 flex flex-wrap gap-2">
          {d.sell.wantedList.map((w) => (
            <li key={w} className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-semibold backdrop-blur">
              {w}
            </li>
          ))}
        </ul>
      </PageHero>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {d.sell.benefits.map((b, i) => {
            const Icon = icons[i];
            return (
              <Reveal key={b.title} delay={i * 0.08}>
                <div className="bg-surface border-line shadow-card h-full rounded-xl border p-7">
                  <span className="bg-accent-gradient mb-4 grid size-12 place-items-center rounded-2xl text-[#0b1f1d]">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="text-lg font-bold">{b.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{b.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <h2 className="mt-16 mb-8 text-3xl font-extrabold">{d.sell.stepsTitle}</h2>
        <ol className="grid gap-5 md:grid-cols-3">
          {d.sell.steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08}>
              <li className="relative h-full rounded-xl border border-line bg-surface-2 p-7 pt-10">
                <span className="bg-brand-gradient absolute -top-5 left-7 grid size-11 place-items-center rounded-full font-display text-lg font-extrabold text-white shadow-lg">
                  {i + 1}
                </span>
                <h3 className="text-lg font-bold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{s.text}</p>
              </li>
            </Reveal>
          ))}
        </ol>

        <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div>
            <h2 className="text-3xl font-extrabold">{d.sell.formTitle}</h2>
            <p className="mt-3 text-muted">{d.sell.formText}</p>
            <p className="mt-6 text-sm text-muted">{d.contact.visitNote}</p>
            <a href={`tel:${site.phoneHref}`} className="mt-6 inline-flex rounded-full border-2 border-accent px-6 py-3 font-bold text-ink transition hover:bg-accent hover:text-black">
              {d.common.callUs}: {site.phone}
            </a>
          </div>
          <ContactForm kind="sell" />
        </div>
      </div>
    </>
  );
}
