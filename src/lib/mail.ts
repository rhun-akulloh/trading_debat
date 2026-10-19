import "server-only";
import nodemailer from "nodemailer";
import fs from "node:fs/promises";
import path from "node:path";
import { site } from "./site";

export type Attachment = { filename: string; content: Buffer; contentType?: string };
export type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: Attachment[];
};

export const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const ownerAddress = () => process.env.MAIL_TO || site.email;

function transport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  const port = Number(process.env.SMTP_PORT ?? 587);
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}

/** Keep a local copy so a mail outage never loses an order or enquiry. */
export async function saveCopy(kind: string, id: string, payload: unknown) {
  try {
    const dir = path.join(process.cwd(), ".data", kind);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, `${id}.json`), JSON.stringify(payload, null, 2));
    return true;
  } catch {
    return false;
  }
}

/**
 * Sends the mails. Returns false when SMTP isn't configured (dev) — callers decide
 * whether that's acceptable. Throws if SMTP is configured but delivery fails.
 */
export async function sendMails(mails: Mail[]) {
  const t = transport();
  if (!t) {
    for (const m of mails) console.log(`\n[mail:not-sent — SMTP_HOST unset] to=${m.to} subject="${m.subject}"\n${m.text}\n`);
    return false;
  }
  const from = process.env.MAIL_FROM || `${site.name} <${site.email}>`;
  for (const m of mails) {
    await t.sendMail({
      from,
      to: m.to,
      subject: m.subject,
      html: m.html,
      text: m.text,
      replyTo: m.replyTo,
      attachments: m.attachments,
    });
  }
  return true;
}

/** Branded HTML shell shared by all mails. */
export function shell(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f1f5f3;font-family:Arial,Helvetica,sans-serif;color:#0b1f1d">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden">
<tr><td style="background:linear-gradient(135deg,#071f1e,#0e3b3a);padding:24px 28px;color:#fff">
<div style="font-size:11px;letter-spacing:3px;color:#ff6a3d;text-transform:uppercase;font-weight:700">De Baat</div>
<div style="font-size:24px;font-weight:800">Trading</div></td></tr>
<tr><td style="height:6px;background:repeating-linear-gradient(-45deg,#ff6a3d 0 12px,#0a2a28 12px 24px)"></td></tr>
<tr><td style="padding:28px"><h1 style="margin:0 0 16px;font-size:22px">${esc(title)}</h1>${body}</td></tr>
<tr><td style="padding:18px 28px;background:#e3ebe7;font-size:12px;color:#546461">${esc(site.name)} · ${esc(site.owner)} · ${esc(site.phone)} · ${esc(site.email)}<br>${esc(site.address.street)}, ${esc(site.address.postcode)} ${esc(site.address.city)} · KVK ${esc(site.kvk)}</td></tr>
</table></td></tr></table></body></html>`;
}
