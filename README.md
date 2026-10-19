# De Baat Trading — website

Rebuild of debaattrading.nl: used & new forklifts, stackers and pallet trucks, plus a "we buy your machines" page.
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion. Dutch + English.

> **This is the restyled variant** (charcoal + safety yellow, contact bar, hero search panel, featured grid and compact
> category tiles). It has the same features and data model as the original navy/orange site, but is a separate project:
> **give it its own database, admin accounts, storage and domain** — never point two sites at the same `DATABASE_URL`.
> The look lives in `src/app/globals.css` (colour tokens + fonts), `src/components/header.tsx` and `src/app/[lang]/page.tsx`.
> Company details (name, phone, IBAN, KVK, address) are in `src/lib/site.ts` — check them before launch, because
> orders and payments go to whatever is shown there.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000  (redirects to /nl or /en)
npm run build && npm start
```

Copy `.env.example` to `.env.local`. With **no variables at all** everything still runs locally:
emails are printed to the terminal, orders/enquiries are saved as JSON in `.data/`, and product edits in the
admin are saved to `.data/products.json` (all git-ignored).

## Where things live

| What | Where |
| --- | --- |
| Company details (address, phone, IBAN, VAT, delivery price) | `src/lib/site.ts` — single source of truth |
| Starter catalog (21 products, loaded into the database once) | `src/data/products.json` |
| Product storage (Postgres / local file) | `src/lib/store*.ts` |
| Admin area, login, upload | `src/app/admin/`, `src/lib/auth.ts`, `src/lib/images.ts` |
| Product photos (WebP) / hero video | `public/products/`, `public/media/` |
| Dutch / English text | `src/dictionaries/nl.ts`, `en.ts` (English is type-checked against Dutch) |
| Sales terms (verbatim Dutch) | `src/data/terms.json` |
| Order validation + totals | `src/lib/order.ts` (server recomputes prices; never trusts the browser) |
| Email | `src/lib/mail.ts`, `src/app/api/order`, `src/app/api/contact` |
| Cart (localStorage) | `src/lib/cart.ts` |

## Managing products (the owner's admin)

Go to **`/admin`** and log in. From there the owner can add, edit, hide, mark as sold and delete products,
upload and reorder photos (they are shrunk automatically), and flag products as "featured" on the homepage.
Changes show on the public site immediately. English text is optional and falls back to the Dutch.

### One-time setup (about 10 minutes)

1. **Database** — create a free project at [neon.tech](https://neon.tech), copy the pooled connection string into `DATABASE_URL`.
   The tables are created and the 21 starter products loaded automatically on first use (only once —
   deleting products later never brings them back).
2. **Photos** — in Vercel: *Storage → Create → Blob*, connect it to the project (adds `BLOB_READ_WRITE_TOKEN`).
3. **Login** — run `npm run admin:hash -- "a long password"` and copy the two printed values into
   `ADMIN_PASSWORD_HASH` and `AUTH_SECRET`, plus `ADMIN_EMAIL`.
   Changing `AUTH_SECRET` logs everyone out; changing the hash changes the password.
   **More than one admin:** run `npm run admin:hash -- "their password" --slot 2` (up to slot 5) and set
   `ADMIN_EMAIL_2` + `ADMIN_PASSWORD_HASH_2`. Each person logs in with their own e-mail and password, and the
   dashboard shows who is signed in. Delete a pair of variables and that person is locked out immediately,
   even if they are still logged in. Tip: copy the hash from a file, not from the terminal, because long
   lines wrap and a line break inside the value breaks the login.
4. Redeploy so the new variables take effect.

Self-hosting on one server with a persistent disk? `PRODUCT_STORE=file` stores products in `.data/products.json`
instead of Postgres (photos still need Blob).

## Things the owner should confirm

The old site contradicted itself; these were resolved as below — please check:

1. **Pick-up address** — old order e-mail said *Meerweg 55D, Berkel en Rodenrijs*; the site says *Tweede Tochtweg 143A*. Using Tweede Tochtweg 143A.
2. **Delivery price** — shop config charged **€100**, terms (clause 20) say **€50**. Using €100 (`site.deliveryPrice`).
3. **Company name** — "De Baat Trading", "De Baat Trading BV" (terms) and "De Baat Handelsonderneming" (bank account name). The IBAN holder name is kept as *De Baat Handelsonderneming*.
4. **Governing law** — terms clause 48 says *Belgian* law although the company is Dutch. Reproduced verbatim; worth a lawyer's look.
5. **Analytics** — the old Universal Analytics ID is dead and was not carried over; no tracking is included.
6. **Terms of sale / privacy / cookie text** is Dutch and legally binding as written; the cookie and privacy blurbs are new and describe what this site actually does.

## Deploying

Full step-by-step guides (Google Cloud Run, a VPS with Docker and automatic HTTPS, or Vercel) are in
**[docs/DEPLOY.md](docs/DEPLOY.md)**. The repo includes a `Dockerfile`, `docker-compose.yml` and `Caddyfile`.
Photo storage is chosen by environment variable: `BLOB_READ_WRITE_TOKEN` (Vercel Blob), `GCS_BUCKET` (Google Cloud
Storage) or `UPLOAD_DIR` (a folder on the server). The old hosting/domain credentials are lost — the domain's DNS must
be recovered via the registrar (SIDN/.nl registrant) to point it at the new host.
