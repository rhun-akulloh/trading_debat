"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { useI18n } from "./i18n-provider";

export function ShareButton({ title }: { title: string }) {
  const { dict } = useI18n();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 py-3 text-sm font-bold transition hover:border-accent hover:text-accent"
    >
      {copied ? <Check className="size-4 text-ok" /> : <Share2 className="size-4" />}
      <span aria-live="polite">{copied ? dict.product.copied : dict.product.share}</span>
    </button>
  );
}
