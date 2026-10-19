import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/dictionaries";
import { fmt, hasLocale } from "@/lib/i18n";
import { site } from "@/lib/site";
import terms from "@/data/terms.json";
import { PageHero } from "@/components/page-hero";

export async function generateMetadata({ params }: PageProps<"/[lang]/terms">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: getDictionary(lang).terms.title, alternates: { languages: { nl: "/nl/terms", en: "/en/terms" } } };
}

export default async function TermsPage({ params }: PageProps<"/[lang]/terms">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);

  return (
    <>
      <PageHero title={d.terms.title} subtitle={d.terms.subtitle} eyebrow={site.name} />
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <section className="bg-surface border-line shadow-card rounded-xl border p-6">
            <h2 className="text-xl font-extrabold">{d.terms.cookiesTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{d.terms.cookiesText}</p>
          </section>
          <section className="bg-surface border-line shadow-card rounded-xl border p-6">
            <h2 className="text-xl font-extrabold">{d.terms.privacyTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{fmt(d.terms.privacyText, { email: site.email })}</p>
          </section>
        </div>

        <p className="mt-10 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4 text-sm font-medium">{d.terms.langNote}</p>

        <article lang="nl" className="mt-8 space-y-10">
          {terms.sections.map((s) => (
            <section key={s.title}>
              <h2 className="mb-4 border-b-2 border-accent pb-2 text-lg font-extrabold tracking-wide uppercase">{s.title}</h2>
              <ol className="space-y-3">
                {s.clauses.map((c) => (
                  <li key={c.n} className="flex gap-4 text-[15px] leading-relaxed">
                    <span className="bg-brand-gradient grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white">{c.n}</span>
                    <p>{c.text}</p>
                  </li>
                ))}
              </ol>
            </section>
          ))}
          <p className="text-center text-lg font-extrabold">{terms.closing}</p>
        </article>
      </div>
    </>
  );
}
