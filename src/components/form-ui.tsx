"use client";

import { useId } from "react";
import { useI18n } from "./i18n-provider";

type Common = { label: string; error?: string; required?: boolean; className?: string };

const base =
  "w-full rounded-xl border bg-surface px-4 py-3 text-[15px] font-medium transition placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/15 outline-none";

export function Field({
  label,
  error,
  required,
  className = "",
  ...input
}: Common & Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">) {
  const { dict } = useI18n();
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold">
        {label}
        {required ? <span className="text-brand-2"> *</span> : <span className="font-normal text-muted"> ({dict.common.optional})</span>}
      </label>
      <input
        id={id}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={`${base} ${error ? "border-red-500" : "border-line"}`}
        {...input}
      />
      {error && (
        <p id={`${id}-err`} className="mt-1.5 text-sm font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextArea({
  label,
  error,
  required,
  className = "",
  ...input
}: Common & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className">) {
  const { dict } = useI18n();
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold">
        {label}
        {required ? <span className="text-brand-2"> *</span> : <span className="font-normal text-muted"> ({dict.common.optional})</span>}
      </label>
      <textarea
        id={id}
        required={required}
        rows={5}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={`${base} resize-y ${error ? "border-red-500" : "border-line"}`}
        {...input}
      />
      {error && (
        <p id={`${id}-err`} className="mt-1.5 text-sm font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

export function Honeypot() {
  // Hidden from people; bots tend to fill every input.
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

export function SubmitButton({ busy, children, busyLabel }: { busy: boolean; children: React.ReactNode; busyLabel: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="bg-accent-gradient inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 font-bold text-[#0b1f1d] shadow-lg transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
    >
      {busy ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {busyLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
