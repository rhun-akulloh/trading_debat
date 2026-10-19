import { clientIp, rateLimited } from "@/lib/rate-limit";
import { computeTotals, makeOrderNumber, orderSchema } from "@/lib/order";
import { esc, ownerAddress, saveCopy, sendMails, shell } from "@/lib/mail";
import { formatPrice, type Product } from "@/lib/products";
import { getOrderableByIds } from "@/lib/store";
import { fullAddress, site } from "@/lib/site";
import type { Locale } from "@/lib/i18n";

const T = {
  nl: {
    subject: (n: string) => `Bevestiging van uw bestelling ${n} — ${site.name}`,
    title: "Bedankt voor uw bestelling",
    intro: (n: string) => `Wij hebben uw bestelling <b>${n}</b> ontvangen. Hieronder vindt u een overzicht.`,
    item: "Machine", price: "Prijs (excl. BTW)", subtotal: "Subtotaal", shipping: "Verzending", vat: "BTW 21%", total: "Totaal (incl. BTW)",
    pickup: "Afhalen", delivery: "Bezorgen",
    pickupText: `Het product kan worden opgehaald bij onze vestiging (${fullAddress}). Neem vooraf contact met ons op voor een afspraak.`,
    deliveryText: "Als de betaling door ons ontvangen is wordt het product door ons bezorgd op een door u aan te geven locatie. Het product zal worden geleverd over 3-5 dagen. Neem s.v.p. contact met ons op voor een datum en tijd van bezorging.",
    transferText: (n: string) => `Hier vindt u de benodigde gegevens voor het doen van een betaling via bankoverschrijving:<br><br>De betaling dient overgemaakt te worden op bankrekeningnummer <b>${site.iban}</b> t.n.v. <b>${site.legalName}</b> onder vermelding van het gekochte product en het bestelnummer <b>${n}</b>.<br><br>Als de betaling bij ons binnengekomen is kunt u het product ophalen of wordt het door ons opgestuurd, afhankelijk van wat u heeft aangegeven.`,
    cashText: "Bij het afhalen van het product wordt de betaling incl. BTW door u gedaan.",
    regards: "Met vriendelijke groet,",
    payment: "Betaling", delivering: "Levering",
  },
  en: {
    subject: (n: string) => `Confirmation of your order ${n} — ${site.name}`,
    title: "Thank you for your order",
    intro: (n: string) => `We have received your order <b>${n}</b>. Here is a summary.`,
    item: "Machine", price: "Price (excl. VAT)", subtotal: "Subtotal", shipping: "Shipping", vat: "VAT 21%", total: "Total (incl. VAT)",
    pickup: "Pick-up", delivery: "Delivery",
    pickupText: `The product can be collected at our premises (${fullAddress}). Please contact us beforehand to make an appointment.`,
    deliveryText: "Once we have received your payment, we will deliver the product to the location you specify. Delivery takes 3–5 days. Please contact us to agree a date and time.",
    transferText: (n: string) => `Payment details for your bank transfer:<br><br>Please transfer the amount to account number <b>${site.iban}</b> in the name of <b>${site.legalName}</b>, quoting the product and order number <b>${n}</b>.<br><br>Once your payment has arrived you can collect the product, or we will send it, depending on what you selected.`,
    cashText: "Payment incl. VAT is made on collection of the product.",
    regards: "Kind regards,",
    payment: "Payment", delivering: "Delivery",
  },
} satisfies Record<Locale, unknown>;

export async function POST(req: Request) {
  if (rateLimited(`order:${clientIp(req)}`)) return Response.json({ error: "rate_limited" }, { status: 429 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const parsed = orderSchema.safeParse(json);
  if (!parsed.success) return Response.json({ error: "invalid", issues: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 422 });
  const o = parsed.data;

  // Prices always come from the store, never from the browser. Sold/hidden machines can't be ordered.
  const found = await getOrderableByIds(Array.from(new Set(o.items)));
  if (found.some((p) => !p)) return Response.json({ error: "unavailable" }, { status: 409 });
  const items = found as Product[];

  const totals = computeTotals(items.map((p) => p.price), o.shipping);
  const orderNumber = makeOrderNumber();
  const t = T[o.locale];
  const money = (n: number) => formatPrice(n, o.locale, true);
  const c = o.customer;

  const rows = items
    .map(
      (p) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #d3dfda">${esc(p.title[o.locale])} <span style="color:#546461">(#${p.article})</span></td><td align="right" style="padding:8px 0;border-bottom:1px solid #d3dfda">${money(p.price)}</td></tr>`,
    )
    .join("");
  const sumRow = (l: string, v: string, bold = false) =>
    `<tr><td style="padding:6px 0;${bold ? "font-weight:800;font-size:16px" : "color:#546461"}">${l}</td><td align="right" style="padding:6px 0;${bold ? "font-weight:800;font-size:16px" : ""}">${v}</td></tr>`;
  const table = `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px"><tr><th align="left" style="padding-bottom:8px;color:#546461;font-size:12px;text-transform:uppercase">${t.item}</th><th align="right" style="padding-bottom:8px;color:#546461;font-size:12px;text-transform:uppercase">${t.price}</th></tr>${rows}
${sumRow(t.subtotal, money(totals.subtotal))}${sumRow(`${t.shipping} (${o.shipping === "pickup" ? t.pickup : t.delivery})`, money(totals.shippingCost))}${sumRow(t.vat, money(totals.vat))}${sumRow(t.total, money(totals.total), true)}</table>`;

  const customerHtml = shell(
    t.title,
    `<p style="line-height:1.6">${t.intro(orderNumber)}</p>${table}
<h3 style="margin:24px 0 6px">${t.payment}</h3><p style="line-height:1.6;margin:0">${o.payment === "transfer" ? t.transferText(orderNumber) : t.cashText}</p>
<h3 style="margin:24px 0 6px">${t.delivering}</h3><p style="line-height:1.6;margin:0">${o.shipping === "pickup" ? t.pickupText : t.deliveryText}</p>
<p style="margin-top:24px;line-height:1.6">${t.regards}<br>${esc(site.owner)}<br>${esc(site.phone)}</p>`,
  );
  const customerText = `${t.title} — ${orderNumber}\n\n${items.map((p) => `- ${p.title[o.locale]} (#${p.article}): ${money(p.price)}`).join("\n")}\n\n${t.total}: ${money(totals.total)}\n\n${(o.payment === "transfer" ? t.transferText(orderNumber) : t.cashText).replace(/<br>/g, "\n").replace(/<[^>]+>/g, "")}\n\n${t.regards}\n${site.owner}\n${site.phone}`;

  const ownerHtml = shell(
    `Nieuwe bestelling ${orderNumber}`,
    `${table}
<h3 style="margin:24px 0 6px">Klant</h3>
<p style="line-height:1.7;margin:0">${c.company ? `<b>${esc(c.company)}</b><br>` : ""}${esc(c.name)}<br>${esc(c.address)}<br>${esc(c.postcode)} ${esc(c.city)}<br>
<a href="tel:${esc(c.phone)}">${esc(c.phone)}</a> · <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>
<p style="margin:16px 0 0"><b>Levering:</b> ${o.shipping === "pickup" ? "Afhalen" : "Bezorgen"} · <b>Betaling:</b> ${o.payment === "transfer" ? "Bankoverschrijving" : "Contant bij ophalen"} · <b>Taal:</b> ${o.locale}</p>
${c.note ? `<h3 style="margin:24px 0 6px">Opmerking</h3><p style="white-space:pre-wrap;margin:0">${esc(c.note)}</p>` : ""}`,
  );
  const ownerText = `Nieuwe bestelling ${orderNumber}\n\n${items.map((p) => `- ${p.title.nl} (#${p.article}): ${money(p.price)}`).join("\n")}\nTotaal incl. BTW: ${money(totals.total)}\n\n${c.company ? c.company + "\n" : ""}${c.name}\n${c.address}\n${c.postcode} ${c.city}\n${c.phone} · ${c.email}\nLevering: ${o.shipping} · Betaling: ${o.payment}\n${c.note ? "\nOpmerking: " + c.note : ""}`;

  const saved = await saveCopy("orders", orderNumber, { orderNumber, at: new Date().toISOString(), ...o, totals, items: items.map((p) => ({ id: p.id, article: p.article, title: p.title.nl, price: p.price })) });

  try {
    const sent = await sendMails([
      { to: ownerAddress(), subject: `Nieuwe bestelling ${orderNumber} — ${c.name}`, html: ownerHtml, text: ownerText, replyTo: c.email },
      { to: c.email, subject: t.subject(orderNumber), html: customerHtml, text: customerText },
    ]);
    if (!sent && process.env.NODE_ENV === "production") {
      console.error(`[order ${orderNumber}] SMTP not configured in production; saved locally: ${saved}`);
      return Response.json({ error: "mail_not_configured" }, { status: 503 });
    }
  } catch (err) {
    console.error(`[order ${orderNumber}] mail failed (saved locally: ${saved})`, err);
    return Response.json({ error: "mail_failed" }, { status: 502 });
  }

  return Response.json({ ok: true, orderNumber });
}
