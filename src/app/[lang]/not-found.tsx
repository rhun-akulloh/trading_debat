import Link from "next/link";
import { ForkliftMark } from "@/components/logo";

// Bilingual on purpose: this file can't know the locale for unmatched URLs.
export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4 py-20 text-center">
      <div>
        <ForkliftMark className="animate-float mx-auto size-24" />
        <p className="text-gradient mt-6 font-display text-8xl font-extrabold">404</p>
        <h1 className="mt-2 text-2xl font-extrabold">Pagina niet gevonden · Page not found</h1>
        <p className="mt-3 text-muted">Deze pagina bestaat niet (meer). · This page doesn&apos;t exist (anymore).</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/nl" className="bg-accent-gradient rounded-full px-6 py-3 font-bold text-[#0b1f1d]">Home NL</Link>
          <Link href="/en" className="rounded-full border-2 border-line px-6 py-3 font-bold">Home EN</Link>
        </div>
      </div>
    </div>
  );
}
