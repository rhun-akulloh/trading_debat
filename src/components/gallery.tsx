"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { fmt } from "@/lib/i18n";
import { useI18n } from "./i18n-provider";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const { dict } = useI18n();
  const [i, setI] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const thumbs = useRef<HTMLDivElement>(null);
  const n = images.length;

  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  useEffect(() => {
    thumbs.current?.children[i]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [i]);

  // Swipe support
  const touchX = useRef<number | null>(null);
  const swipe = {
    onTouchStart: (e: React.TouchEvent) => {
      touchX.current = e.touches[0].clientX;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchX.current === null) return;
      const dx = e.changedTouches[0].clientX - touchX.current;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      touchX.current = null;
    },
  };

  const label = fmt(dict.product.gallery, { i: i + 1, n });

  return (
    <div className="min-w-0 space-y-3">
      <div
        className="group bg-surface-2 border-line shadow-card relative aspect-[4/3] overflow-hidden rounded-xl border sm:aspect-[5/4]"
        {...swipe}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={i}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Image
              src={images[i]}
              alt={`${alt} — ${label}`}
              fill
              priority={i === 0}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-contain"
            />
          </motion.div>
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label={dict.product.zoom}
          className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/75"
        >
          <Expand className="size-4" />
        </button>
        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={dict.product.prev}
              className="absolute top-1/2 left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white opacity-90 backdrop-blur transition hover:bg-black/75 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={dict.product.next}
              className="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white opacity-90 backdrop-blur transition hover:bg-black/75 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight className="size-5" />
            </button>
            <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              {i + 1} / {n}
            </span>
          </>
        )}
      </div>

      {n > 1 && (
        <div ref={thumbs} className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {images.map((src, idx) => (
            <button
              key={src}
              type="button"
              onClick={() => setI(idx)}
              aria-label={fmt(dict.product.gallery, { i: idx + 1, n })}
              aria-current={idx === i}
              className={`relative aspect-[4/3] h-16 shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-20 ${
                idx === i ? "border-accent" : "border-transparent opacity-65 hover:opacity-100"
              }`}
            >
              <Image src={src} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-[70] grid place-items-center bg-black/90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
            role="dialog"
            aria-modal="true"
            aria-label={alt}
          >
            <button
              type="button"
              aria-label={dict.nav.close}
              className="absolute top-4 right-4 grid size-11 place-items-center rounded-full bg-white/15 text-white"
              onClick={() => setLightbox(false)}
            >
              <X className="size-5" />
            </button>
            <div className="relative h-[85vh] w-full max-w-5xl" onClick={(e) => e.stopPropagation()} {...swipe}>
              <Image src={images[i]} alt={`${alt} — ${label}`} fill sizes="100vw" className="object-contain" />
            </div>
            {n > 1 && (
              <>
                <button
                  type="button"
                  aria-label={dict.product.prev}
                  onClick={(e) => {
                    e.stopPropagation();
                    go(-1);
                  }}
                  className="absolute left-4 grid size-12 place-items-center rounded-full bg-white/15 text-white"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  aria-label={dict.product.next}
                  onClick={(e) => {
                    e.stopPropagation();
                    go(1);
                  }}
                  className="absolute right-4 grid size-12 place-items-center rounded-full bg-white/15 text-white"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
