"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { login } from "@/app/admin/actions";
import { useAdmin } from "./admin-i18n-provider";

export function LoginForm() {
  const { t } = useAdmin();
  const [state, action, pending] = useActionState(login, undefined);
  const [show, setShow] = useState(false);
  const input =
    "w-full rounded-xl border border-line bg-surface px-4 py-3 font-medium outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15";
  return (
    <form action={action} className="space-y-4">
      <label className="block text-sm font-bold">
        {t.login.email}
        <input name="email" type="email" required autoComplete="username" defaultValue={state?.email} className={`${input} mt-1.5`} />
      </label>
      <div>
        <label htmlFor="admin-password" className="block text-sm font-bold">
          {t.login.password}
        </label>
        <div className="relative mt-1.5">
          <input
            id="admin-password"
            name="password"
            type={show ? "text" : "password"}
            required
            autoComplete="current-password"
            className={`${input} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? t.login.hidePassword : t.login.showPassword}
            aria-pressed={show}
            title={show ? t.login.hidePassword : t.login.showPassword}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-muted transition hover:text-ink"
          >
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
      </div>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">
          {t.login[state.error]}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-accent-gradient w-full rounded-full px-6 py-3.5 font-bold text-[#0b1f1d] shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60"
      >
        {pending ? t.login.submitting : t.login.submit}
      </button>
    </form>
  );
}
