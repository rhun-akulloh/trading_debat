"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Banknote, Building2, CheckCircle2, Landmark, Package, Store, Truck } from "lucide-react";
import { cartActions } from "@/lib/cart";
import { computeTotals, type Payment, type Shipping } from "@/lib/order";
import { formatPrice } from "@/lib/products";
import { site } from "@/lib/site";
import { useI18n } from "./i18n-provider";
import { useCartProducts } from "./cart-view";
import { Field, Honeypot, SubmitButton, TextArea } from "./form-ui";

type Fields = "name" | "address" | "postcode" | "city" | "phone" | "email" | "terms";

function Choice({
  selected,
  disabled,
  onClick,
  icon: Icon,
  title,
  text,
  extra,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
  extra?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition ${
        selected ? "border-accent bg-accent/10" : "border-line bg-surface hover:border-accent/50"
      } ${disabled ? "cursor-not-allowed opacity-45" : ""}`}
    >
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${selected ? "bg-accent-gradient text-[#0b1f1d]" : "bg-surface-2 text-muted"}`}>
        <Icon className="size-5" />
      </span>
      <span className="flex-1">
        <span className="flex justify-between gap-2 font-bold">
          {title}
          {extra && <span className="text-brand-2">{extra}</span>}
        </span>
        <span className="mt-1 block text-sm text-muted">{text}</span>
      </span>
    </button>
  );
}

export function CheckoutForm() {
  const { locale, dict } = useI18n();
  const d = dict.checkout;
  const { items, loading } = useCartProducts();
  const [shipping, setShipping] = useState<Shipping>("pickup");
  const [payment, setPayment] = useState<Payment>("transfer");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "error" | "unavailable">("idle");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const totals = computeTotals(items.map((p) => p.price), shipping);
  const money = (n: number) => formatPrice(n, locale, true);

  const chooseShipping = (s: Shipping) => {
    setShipping(s);
    if (s === "delivery" && payment === "cash") setPayment("transfer");
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const v = d.validation;
    const next: Partial<Record<Fields, string>> = {};
    (["name", "address", "postcode", "city"] as const).forEach((k) => {
      if (!get(k)) next[k] = v.required;
    });
    if (!/^[+\d][\d\s().-]{5,}$/.test(get("phone"))) next.phone = v.phone;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(get("email"))) next.email = v.email;
    if (!terms) next.terms = v.terms;
    setErrors(next);
    if (Object.keys(next).length) {
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((p) => p.id),
          shipping,
          payment,
          acceptTerms: true,
          locale,
          website: get("website"),
          customer: {
            company: get("company"),
            name: get("name"),
            address: get("address"),
            postcode: get("postcode"),
            city: get("city"),
            phone: get("phone"),
            email: get("email"),
            note: get("note"),
          },
        }),
      });
      if (res.status === 409) {
        setStatus("unavailable");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      setOrderNumber(json.orderNumber);
      cartActions.clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setStatus("error");
    }
  }

  if (orderNumber) {
    return (
      <div className="bg-surface border-line shadow-lift mx-auto max-w-xl rounded-xl border p-10 text-center" role="status">
        <CheckCircle2 className="mx-auto size-20 text-ok" />
        <h2 className="mt-5 text-3xl font-extrabold">{d.successTitle}</h2>
        <p className="mx-auto mt-3 max-w-md text-muted">{d.successText}</p>
        <p className="mt-6 inline-block rounded-2xl bg-surface-2 px-6 py-3">
          <span className="block text-xs font-bold tracking-wider text-muted uppercase">{d.orderNumber}</span>
          <span className="font-display text-2xl font-extrabold">{orderNumber}</span>
        </p>
        <div className="mt-8">
          <Link href={`/${locale}`} className="bg-accent-gradient inline-flex rounded-full px-8 py-4 font-bold text-[#0b1f1d]">
            {d.backHome}
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return <div className="mx-auto h-64 max-w-xl animate-pulse rounded-xl bg-surface-2" aria-busy="true" />;

  if (items.length === 0) {
    return (
      <div className="bg-surface border-line mx-auto max-w-xl rounded-xl border border-dashed p-12 text-center">
        <Package className="mx-auto size-14 text-muted" />
        <h2 className="mt-4 text-2xl font-extrabold">{dict.cart.empty}</h2>
        <Link href={`/${locale}/products`} className="bg-accent-gradient mt-6 inline-flex rounded-full px-7 py-3.5 font-bold text-[#0b1f1d]">
          {dict.home.ctaPrimary}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <Honeypot />
      <div className="space-y-8">
        <section className="bg-surface border-line shadow-card rounded-xl border p-6 sm:p-8">
          <h2 className="mb-5 flex items-center gap-3 text-xl font-extrabold">
            <span className="bg-brand-gradient grid size-8 place-items-center rounded-full text-sm text-white">1</span> {d.contact}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field name="company" label={d.company} autoComplete="organization" className="sm:col-span-2" />
            <Field name="name" label={d.name} required autoComplete="name" error={errors.name} />
            <Field name="phone" type="tel" label={d.phone} required autoComplete="tel" error={errors.phone} />
            <Field name="email" type="email" label={d.email} required autoComplete="email" error={errors.email} className="sm:col-span-2" />
            <Field name="address" label={d.address} required autoComplete="street-address" error={errors.address} className="sm:col-span-2" />
            <Field name="postcode" label={d.postcode} required autoComplete="postal-code" error={errors.postcode} />
            <Field name="city" label={d.city} required autoComplete="address-level2" error={errors.city} />
            <TextArea name="note" label={d.note} className="sm:col-span-2" rows={3} />
          </div>
        </section>

        <section className="bg-surface border-line shadow-card rounded-xl border p-6 sm:p-8">
          <h2 className="mb-5 flex items-center gap-3 text-xl font-extrabold">
            <span className="bg-brand-gradient grid size-8 place-items-center rounded-full text-sm text-white">2</span> {d.shipping}
          </h2>
          <div role="radiogroup" aria-label={d.shipping} className="grid gap-3">
            <Choice selected={shipping === "pickup"} onClick={() => chooseShipping("pickup")} icon={Store} title={d.pickup} text={d.pickupText} extra="€ 0" />
            <Choice selected={shipping === "delivery"} onClick={() => chooseShipping("delivery")} icon={Truck} title={d.delivery} text={d.deliveryText} extra={`€ ${site.deliveryPrice}`} />
          </div>

          <h2 className="mt-8 mb-5 flex items-center gap-3 text-xl font-extrabold">
            <span className="bg-brand-gradient grid size-8 place-items-center rounded-full text-sm text-white">3</span> {d.payment}
          </h2>
          <div role="radiogroup" aria-label={d.payment} className="grid gap-3">
            <Choice selected={payment === "transfer"} onClick={() => setPayment("transfer")} icon={Landmark} title={d.transfer} text={d.transferText} />
            <Choice
              selected={payment === "cash"}
              disabled={shipping !== "pickup"}
              onClick={() => setPayment("cash")}
              icon={Banknote}
              title={d.cash}
              text={shipping === "pickup" ? d.cashText : d.cashNeedsPickup}
            />
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="bg-surface border-line shadow-card rounded-xl border p-6">
          <h2 className="text-xl font-extrabold">{d.summary}</h2>
          <ul className="mt-5 space-y-4">
            {items.map((p) => (
              <li key={p.id} className="flex gap-3">
                <span className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                  <Image src={p.image} alt="" fill sizes="80px" className="object-cover" />
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block truncate font-bold">{p.title[locale]}</span>
                  <span className="text-muted">#{p.article}</span>
                </span>
                <span className="text-sm font-bold">{formatPrice(p.price, locale)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
            <div className="flex justify-between"><dt className="text-muted">{dict.cart.subtotal}</dt><dd className="font-semibold">{money(totals.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">{dict.cart.shipping}</dt><dd className="font-semibold">{money(totals.shippingCost)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">{dict.cart.vat.replace("{rate}", String(site.vatRate * 100))}</dt><dd className="font-semibold">{money(totals.vat)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-base"><dt className="font-bold">{dict.cart.total}</dt><dd className="font-display text-xl font-extrabold">{money(totals.total)}</dd></div>
          </dl>

          <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              aria-invalid={!!errors.terms}
              className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]"
            />
            <span>
              {d.terms.split("{link}")[0]}
              <Link href={`/${locale}/terms`} target="_blank" className="font-bold text-brand-2 underline">
                {d.termsLink}
              </Link>
              {d.terms.split("{link}")[1]}
            </span>
          </label>
          {errors.terms && <p className="mt-1.5 text-sm font-medium text-red-500">{errors.terms}</p>}

          <p className="mt-3 flex items-center gap-2 text-xs text-muted">
            <Building2 className="size-4" /> {d.business}
          </p>

          {status === "unavailable" && (
            <p role="alert" className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">
              {d.unavailable}
            </p>
          )}
          {status === "error" && (
            <p role="alert" className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">
              {dict.common.error}
            </p>
          )}
          <div className="mt-5 [&>button]:w-full">
            <SubmitButton busy={status === "sending"} busyLabel={d.placing}>
              {d.place}
            </SubmitButton>
          </div>
        </div>
      </aside>
    </form>
  );
}
