"use client";

import Link from "next/link";
import { Check, ShoppingCart } from "lucide-react";
import { cartActions, useCartIds } from "@/lib/cart";
import { useI18n } from "./i18n-provider";

export function AddToCart({
  id,
  size = "md",
  className = "",
}: {
  id: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { locale, dict } = useI18n();
  const inCart = useCartIds().includes(id);
  const pad = size === "lg" ? "px-7 py-4 text-base" : size === "sm" ? "px-4 py-2 text-sm" : "px-5 py-3 text-sm";

  if (inCart) {
    return (
      <Link
        href={`/${locale}/cart`}
        className={`inline-flex items-center justify-center gap-2 rounded-lg border-2 border-ok font-bold text-ok transition hover:bg-ok hover:text-white ${pad} ${className}`}
      >
        <Check className="size-4" /> {dict.common.inCart}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => cartActions.add(id)}
      className={`bg-accent-gradient inline-flex items-center justify-center gap-2 rounded-lg font-extrabold uppercase tracking-wide text-[#0b1f1d] shadow-md transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 ${pad} ${className}`}
    >
      <ShoppingCart className="size-4" /> {dict.common.addToCart}
    </button>
  );
}
