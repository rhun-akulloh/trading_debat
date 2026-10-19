"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Send, X } from "lucide-react";
import { useI18n } from "./i18n-provider";
import { Field, Honeypot, SubmitButton, TextArea } from "./form-ui";

const MAX_FILES = 6;
const MAX_BYTES = 5 * 1024 * 1024;

export function ContactForm({ kind }: { kind: "contact" | "sell" }) {
  const { dict } = useI18n();
  const sell = kind === "sell";
  const [files, setFiles] = useState<{ file: File; url: string }[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [fileError, setFileError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const t = dict.contact;

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFileError("");
    const next = [...files];
    for (const f of Array.from(list)) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type) || f.size > MAX_BYTES) {
        setFileError(dict.sell.photosHint);
        continue;
      }
      if (next.length >= MAX_FILES) break;
      next.push({ file: f, url: URL.createObjectURL(f) });
    }
    setFiles(next);
    if (input.current) input.current.value = "";
  };

  const remove = (i: number) => {
    URL.revokeObjectURL(files[i].url);
    setFiles(files.filter((_, idx) => idx !== i));
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const data = new FormData(e.currentTarget);
    data.set("kind", kind);
    data.delete("photos");
    files.forEach((f) => data.append("photos", f.file));
    try {
      const res = await fetch("/api/contact", { method: "POST", body: data });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="bg-surface border-line shadow-card rounded-xl border p-10 text-center" role="status">
        <CheckCircle2 className="mx-auto size-16 text-ok" />
        <h3 className="mt-4 text-2xl font-extrabold">{t.successTitle}</h3>
        <p className="mt-2 text-muted">{t.successText}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="bg-surface border-line shadow-card relative grid gap-5 rounded-xl border p-6 sm:grid-cols-2 sm:p-8">
      <Honeypot />
      <Field name="company" label={t.company} autoComplete="organization" />
      <Field name="name" label={t.name} required autoComplete="name" />
      <Field name="email" type="email" label={t.email} required autoComplete="email" />
      <Field name="phone" type="tel" label={t.phone} required autoComplete="tel" />
      {sell ? (
        <>
          <Field name="brand" label={dict.sell.brand} />
          <Field name="model" label={dict.sell.type} />
          <Field name="year" label={dict.sell.machineYear} inputMode="numeric" />
          <Field name="usage" label={dict.sell.usage} />
        </>
      ) : (
        <Field name="subject" label={t.subject} className="sm:col-span-2" />
      )}
      <TextArea name="message" label={sell ? dict.sell.condition : t.message} required className="sm:col-span-2" />

      <div className="sm:col-span-2">
        <p className="mb-1.5 text-sm font-bold">
          {sell ? dict.sell.photos : t.attachment} <span className="font-normal text-muted">({dict.common.optional})</span>
        </p>
        <div className="flex flex-wrap gap-3">
          {files.map((f, i) => (
            <div key={f.url} className="group relative size-24 overflow-hidden rounded-xl border border-line">
              <Image src={f.url} alt={f.file.name} fill unoptimized sizes="96px" className="object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`${dict.cart.remove}: ${f.file.name}`}
                className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-black/70 text-white"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          {files.length < MAX_FILES && (
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="grid size-24 place-items-center rounded-xl border-2 border-dashed border-line text-muted transition hover:border-accent hover:text-accent"
            >
              <ImagePlus className="size-6" />
            </button>
          )}
        </div>
        <input ref={input} type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => addFiles(e.target.files)} />
        <p className={`mt-2 text-xs ${fileError ? "font-semibold text-red-500" : "text-muted"}`}>{dict.sell.photosHint}</p>
      </div>

      {status === "error" && (
        <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500 sm:col-span-2">
          {dict.common.error}
        </p>
      )}
      <div className="sm:col-span-2">
        <SubmitButton busy={status === "sending"} busyLabel={dict.common.sending}>
          <Send className="size-4" /> {dict.common.send}
        </SubmitButton>
      </div>
    </form>
  );
}
