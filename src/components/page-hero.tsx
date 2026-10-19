import { Reveal } from "./reveal";

export function PageHero({
  title,
  subtitle,
  eyebrow,
  children,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-brand-gradient relative isolate overflow-hidden text-white">
      <div className="mesh">
        <i className="-top-24 -right-16 size-96 bg-accent/45" />
        <i className="-bottom-32 left-10 size-96 bg-brand-2/70" style={{ animationDelay: "-9s" }} />
      </div>
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <Reveal y={14}>
          {eyebrow && (
            <p className="mb-3 text-xs font-bold tracking-[0.25em] text-accent-2 uppercase">{eyebrow}</p>
          )}
          <h1 className="max-w-3xl text-4xl font-extrabold sm:text-6xl">{title}</h1>
          {subtitle && <p className="mt-4 max-w-2xl text-lg text-white/80">{subtitle}</p>}
          {children}
        </Reveal>
      </div>
      <div className="hazard absolute inset-x-0 bottom-0 h-1.5" />
    </section>
  );
}
