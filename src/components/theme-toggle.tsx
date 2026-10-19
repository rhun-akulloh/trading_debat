"use client";

import { Moon, Sun } from "lucide-react";
import { useI18n } from "./i18n-provider";

export function ThemeToggle({ className = "", variant = "round" }: { className?: string; variant?: "round" | "bar" }) {
  const { dict } = useI18n();

  const toggle = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dict.nav.theme}
      title={dict.nav.theme}
      className={`relative grid place-items-center transition ${
        variant === "bar"
          ? "size-7 rounded bg-white/10 text-white hover:bg-white/20"
          : "size-10 rounded-full border border-line bg-surface text-ink hover:border-accent hover:text-accent"
      } ${className}`}
    >
      <Sun className="size-[18px] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-[18px] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </button>
  );
}
