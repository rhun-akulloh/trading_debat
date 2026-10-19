"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, X } from "lucide-react";
import { compressImage } from "@/lib/compress-image";
import { fmt } from "@/lib/i18n";
import { useAdmin } from "./admin-i18n-provider";

export function ImageManager({ images, onChange }: { images: string[]; onChange: (next: string[]) => void }) {
  const { t } = useAdmin();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState("");

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    let next = [...images];
    for (const file of Array.from(files)) {
      setBusy((n) => n + 1);
      try {
        const blob = await compressImage(file);
        const body = new FormData();
        body.append("file", blob, "photo.jpg");
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error ?? "failed");
        next = [...next, json.url];
        onChange(next);
      } catch (e) {
        const code = e instanceof Error ? e.message : "failed";
        setError(t.images.errors[code as keyof typeof t.images.errors] ?? t.images.errors.failed);
      } finally {
        setBusy((n) => n - 1);
      }
    }
    if (input.current) input.current.value = "";
  }

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((src, i) => (
          <li key={src} className="bg-surface-2 border-line relative aspect-[4/3] overflow-hidden rounded-2xl border">
            <Image src={src} alt={fmt(t.images.photoN, { n: i + 1 })} fill sizes="200px" className="object-cover" unoptimized={src.startsWith("/uploads/")} />
            {i === 0 && <span className="absolute top-2 left-2 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-black">{t.images.main}</span>}
            <button type="button" onClick={() => onChange(images.filter((_, x) => x !== i))} aria-label={fmt(t.images.removeN, { n: i + 1 })}
              className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-black/70 text-white hover:bg-red-600">
              <X className="size-4" />
            </button>
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/70 to-transparent p-2">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label={t.images.earlier} className="grid size-8 place-items-center rounded-full bg-white/20 text-white disabled:opacity-30">
                <ArrowLeft className="size-4" />
              </button>
              <button type="button" disabled={i === images.length - 1} onClick={() => move(i, 1)} aria-label={t.images.later} className="grid size-8 place-items-center rounded-full bg-white/20 text-white disabled:opacity-30">
                <ArrowRight className="size-4" />
              </button>
            </div>
          </li>
        ))}
        {Array.from({ length: busy }).map((_, i) => (
          <li key={`busy-${i}`} className="bg-surface-2 border-line grid aspect-[4/3] place-items-center rounded-2xl border">
            <Loader2 className="size-6 animate-spin text-muted" />
          </li>
        ))}
        <li>
          <button type="button" onClick={() => input.current?.click()}
            className="grid aspect-[4/3] w-full place-items-center rounded-2xl border-2 border-dashed border-line text-muted transition hover:border-accent hover:text-accent">
            <span className="flex flex-col items-center gap-1 text-sm font-semibold">
              <ImagePlus className="size-6" /> {t.images.add}
            </span>
          </button>
        </li>
      </ul>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} />
      <p className="mt-3 text-xs text-muted">{t.images.hint}</p>
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-red-500">{error}</p>}
    </div>
  );
}
