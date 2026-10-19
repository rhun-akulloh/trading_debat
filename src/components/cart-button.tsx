"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartIds } from "@/lib/cart";
import { useI18n } from "./i18n-provider";

export function CartButton() {
  const { locale, dict } = useI18n();
  const ids = useCartIds();

  return (
    <Link
      href={`/${locale}/cart`}
      aria-label={`${dict.nav.cart} (${ids.length})`}
      className="relative grid size-10 place-items-center rounded-lg bg-accent-gradient text-[#0b1f1d] shadow-md transition hover:scale-105 active:scale-95"
    >
      <ShoppingCart className="size-[18px]" />
      {ids.length > 0 && (
        <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-brand-deep px-1 text-[11px] leading-5 font-bold text-white ring-2 ring-bg">
          {ids.length}
        </span>
      )}
    </Link>
  );
}
