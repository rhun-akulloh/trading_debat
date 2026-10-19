import { z } from "zod";
import { clientIp, rateLimited } from "@/lib/rate-limit";
import { esc, ownerAddress, saveCopy, sendMails, shell, type Attachment } from "@/lib/mail";

const MAX_FILES = 6;
const MAX_BYTES = 5 * 1024 * 1024;
const OK_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const t = (max = 200) => z.string().trim().max(max);
const schema = z.object({
  kind: z.enum(["contact", "sell"]),
  company: t().optional(),
  name: t().min(1),
  email: t(254).email(),
  phone: t(30).min(6),
  subject: t().optional(),
  message: t(5000).min(1),
  // sell-only extras
  brand: t().optional(),
  model: t().optional(),
  year: t(10).optional(),
  usage: t(50).optional(),
  website: z.string().max(0).optional(), // honeypot
});

export async function POST(req: Request) {
  if (rateLimited(`contact:${clientIp(req)}`)) return Response.json({ error: "rate_limited" }, { status: 429 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const raw: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string") raw[k] = v;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "invalid", issues: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 422 });
  const d = parsed.data;

  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_FILES) return Response.json({ error: "too_many_files" }, { status: 422 });
  const attachments: Attachment[] = [];
  for (const f of files) {
    if (!OK_TYPES.has(f.type) || f.size > MAX_BYTES) return Response.json({ error: "bad_file" }, { status: 422 });
    attachments.push({ filename: f.name.replace(/[^\w.-]+/g, "_"), content: Buffer.from(await f.arrayBuffer()), contentType: f.type });
  }

  const id = `${d.kind}-${Date.now().toString(36)}`;
  const subject =
    d.kind === "sell"
      ? `Inkoop: ${[d.brand, d.model, d.year].filter(Boolean).join(" ") || "machine"} — ${d.name}`
      : `Contact: ${d.subject || "bericht"} — ${d.name}`;

  const rows: [string, string | undefined][] = [
    ["Bedrijf", d.company],
    ["Naam", d.name],
    ["E-mail", d.email],
    ["Telefoon", d.phone],
    ...(d.kind === "sell"
      ? ([["Merk", d.brand], ["Type", d.model], ["Bouwjaar", d.year], ["Uren / km", d.usage]] as [string, string | undefined][])
      : ([["Onderwerp", d.subject]] as [string, string | undefined][])),
  ];
  const html = shell(
    d.kind === "sell" ? "Nieuw inkoopaanbod" : "Nieuw bericht via de website",
    `<table cellpadding="0" cellspacing="0" style="font-size:14px;width:100%">${rows
      .filter(([, v]) => v)
      .map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#546461;white-space:nowrap">${k}</td><td style="padding:6px 0"><b>${esc(v)}</b></td></tr>`)
      .join("")}</table>
<h3 style="margin:20px 0 6px">${d.kind === "sell" ? "Staat & gebreken" : "Bericht"}</h3>
<p style="white-space:pre-wrap;line-height:1.6;margin:0">${esc(d.message)}</p>
<p style="margin-top:16px;color:#546461;font-size:13px">${attachments.length} foto's bijgevoegd</p>`,
  );
  const text = `${subject}\n\n${rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${d.message}\n\n(${attachments.length} foto's)`;

  const saved = await saveCopy("messages", id, { id, at: new Date().toISOString(), ...d, photos: attachments.map((a) => a.filename) });
  try {
    const sent = await sendMails([{ to: ownerAddress(), subject, html, text, replyTo: d.email, attachments }]);
    if (!sent && process.env.NODE_ENV === "production") {
      console.error(`[${id}] SMTP not configured in production; saved locally: ${saved}`);
      return Response.json({ error: "mail_not_configured" }, { status: 503 });
    }
  } catch (err) {
    console.error(`[${id}] mail failed (saved locally: ${saved})`, err);
    return Response.json({ error: "mail_failed" }, { status: 502 });
  }
  return Response.json({ ok: true });
}
