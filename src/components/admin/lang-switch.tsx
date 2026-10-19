"use client";

import { useRouter } from "next/navigation";
import { ADMIN_LANG_COOKIE, type AdminLang } from "@/lib/admin-i18n";
import { useAdmin } from "./admin-i18n-provider";

function rememberLang(l: AdminLang) {
  document.cookie = `${ADMIN_LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
}

export function AdminLangSwitch() {
  const { lang, t } = useAdmin();
  const router = useRouter();

  const choose = (l: AdminLang) => {
    if (l === lang) return;
    rememberLang(l);
    router.refresh(); // re-render server components with the new language
  };

  return (
    <div role="group" aria-label={t.common.language} className="flex items-center rounded-full border border-line bg-surface p-0.5 text-xs font-bold">
      {(["nl", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          aria-pressed={l === lang}
          lang={l}
          className={`rounded-full px-3 py-2 uppercase transition ${l === lang ? "bg-brand-gradient text-white shadow" : "text-muted hover:text-ink"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
