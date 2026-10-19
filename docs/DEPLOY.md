# Deploying De Baat Trading

The site is a standard Next.js app. It needs a host that can run a Node.js program (it does **not** run on PHP-only
shared hosting). Pick one route:

| | **A. Google Cloud Run** | **B. VPS (TransIP, Hetzner, …)** | **C. Vercel** |
| --- | --- | --- | --- |
| Account owner | The client's Google Cloud account | The client's VPS account | The client's Vercel account |
| Upkeep | Google patches the platform | Someone applies OS updates | Vercel handles it |
| Cost | Pay for use; often a few €/month | Flat, roughly €5–10/month | Pro plan needed for a business |
| Photos | Cloud Storage bucket (`GCS_BUCKET`) | Disk volume (`UPLOAD_DIR`, built in) | Vercel Blob |

Whichever you choose, **the client owns the account and invites the developer**, so nobody is ever locked out again.

---------------------------------------------------------------------------------------------------

## 0. Things every route needs

| What | Where it comes from |
| --- | --- |
| `DATABASE_URL` | A **separate** Neon project for this site (never share a database with another app). Neon → Connection details → pooled string. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (+ `_2` … `_5` for more admins) | `npm run admin:hash -- "a long password" [--slot 2]` — copy from a file, not the terminal (long lines wrap). |
| `AUTH_SECRET` | Printed by the first `admin:hash` run. One secret for the whole site. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | The email service / mailbox that sends order emails. Without them, orders and forms show an error (on purpose). |
| `MAIL_TO`, `MAIL_FROM` | Inbox for order notifications; the verified sender address. |
| Photo storage | Route-specific, see below. |
| A domain | DNS access for `debaattrading.nl`. **Leave the MX (email) records alone.** |

Rules for every value: no quotes, no spaces, one line. (The app forgives quotes and spaces, but don't rely on it.)

The site builds **without** a database or secrets. If the database can't be reached during the build, pages are generated
from the bundled starter catalog and refresh from the real database within a minute.

Check a running site at `/api/health` (add `?deep=1` to include the database).

---------------------------------------------------------------------------------------------------

## A. Google Cloud Run

> These commands were written against Google's documented behaviour but **not run** (no Google account was available
> while preparing this). Do the first deploy together, and expect to adjust a flag or two. Everything inside the
> container itself was tested.

**Prerequisites:** a Google Cloud project with billing enabled, and the [`gcloud` CLI](https://cloud.google.com/sdk/docs/install)
logged in (`gcloud auth login`). The owner should add the developer in IAM with roles *Cloud Run Admin*, *Cloud Build
Editor*, *Artifact Registry Writer*, *Secret Manager Admin*, *Storage Admin* and *Service Account User*.

```bash
PROJECT=your-project-id
REGION=europe-west4                 # Netherlands
SERVICE=de-baat-trading
BUCKET=$PROJECT-photos
gcloud config set project $PROJECT

gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  secretmanager.googleapis.com storage.googleapis.com
```

**1. Photo bucket** (public-read, because product photos are public):
```bash
gcloud storage buckets create gs://$BUCKET --location=$REGION --uniform-bucket-level-access
gcloud storage buckets add-iam-policy-binding gs://$BUCKET --member=allUsers --role=roles/storage.objectViewer
```
If the second command is refused, the organisation has a policy blocking public buckets — ask the Google Cloud admin to allow it for this bucket.

**2. A service account for the website** (it needs no key file — Cloud Run supplies its identity):
```bash
gcloud iam service-accounts create de-baat-run --display-name="De Baat Trading website"
SA=de-baat-run@$PROJECT.iam.gserviceaccount.com
gcloud storage buckets add-iam-policy-binding gs://$BUCKET --member=serviceAccount:$SA --role=roles/storage.objectAdmin
```

**3. Secrets** (one per secret value; paste each value without quotes):
```bash
for NAME in DATABASE_URL AUTH_SECRET ADMIN_PASSWORD_HASH ADMIN_PASSWORD_HASH_2 SMTP_PASS; do
  read -rsp "Value for $NAME (hidden): " VALUE; echo
  printf '%s' "$VALUE" | gcloud secrets create $NAME --data-file=-
  gcloud secrets add-iam-policy-binding $NAME --member=serviceAccount:$SA --role=roles/secretmanager.secretAccessor
done
```
(Skip `ADMIN_PASSWORD_HASH_2` if there's only one admin, and remove it from the `--set-secrets` line below.)

**4. Non-secret settings** — create `env.yaml` (it contains no secrets; don't commit it):
```yaml
GCS_BUCKET: "your-project-id-photos"
ADMIN_EMAIL: "owner@example.com"
ADMIN_EMAIL_2: "second.admin@example.com"
SMTP_HOST: "smtp.example.com"
SMTP_PORT: "587"
SMTP_USER: "user@example.com"
MAIL_TO: "info@debaattrading.nl"
MAIL_FROM: "De Baat Trading <info@debaattrading.nl>"
```

**5. Deploy** (builds the `Dockerfile` in Cloud Build, then runs it):
```bash
gcloud run deploy $SERVICE --source . --region $REGION \
  --service-account $SA --allow-unauthenticated --port 8080 \
  --memory 1Gi --cpu 1 --min-instances 0 --max-instances 1 \
  --env-vars-file env.yaml \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,AUTH_SECRET=AUTH_SECRET:latest,ADMIN_PASSWORD_HASH=ADMIN_PASSWORD_HASH:latest,ADMIN_PASSWORD_HASH_2=ADMIN_PASSWORD_HASH_2:latest,SMTP_PASS=SMTP_PASS:latest"
```
It prints the service URL (`https://…run.app`). Open `/api/health?deep=1` and `/admin`.

**Why these flags**
- `--max-instances 1`: the page cache and the login rate limiter live in memory. With one instance, an admin edit shows
  immediately; with several, other instances catch up within about a minute. Raise it later if traffic needs it.
- `--min-instances 0`: costs nothing when idle, but the first visit after a quiet period takes a few seconds. Use `1`
  for an always-warm site (costs a little more every month).
- Cloud Run's disk is temporary: **email is the only permanent record of an order**, so SMTP must work.
- `NEXT_PUBLIC_SITE_URL` is set in the `Dockerfile` (default `https://debaattrading.nl`). Change that line to use another address.

**6. Your own domain.** Cloud Run domain mappings
(`gcloud beta run domain-mappings create --service $SERVICE --domain debaattrading.nl --region $REGION`) show the DNS
records to add; availability depends on region and changes over time, so check Google's current docs. The alternative is a
load balancer or Firebase Hosting in front of the service. Keep the existing MX records.

**7. Cost control.** In the Google Cloud console: Billing → Budgets & alerts → create a budget (e.g. €10) with email alerts.

**Updating the site:** run the step 5 command again.

---------------------------------------------------------------------------------------------------

## B. VPS (Ubuntu 24.04) with Docker and automatic HTTPS

Tested: the image, the Compose file, Caddy's HTTPS/redirects/compression, photo upload, persistence across restarts.

1. **Create the server** (smallest plan with ≥1 GB RAM) in the *client's* account and add the developer's SSH key.
   Point DNS: an **A record** for `debaattrading.nl` (and `www`) to the server's IP. Leave MX records alone.
2. **Log in and secure it:**
   ```bash
   apt update && apt -y upgrade
   apt -y install ufw unattended-upgrades
   ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable
   dpkg-reconfigure -plow unattended-upgrades          # automatic security updates
   ```
3. **Install Docker:** follow https://docs.docker.com/engine/install/ubuntu/ (includes the `docker compose` plugin).
4. **Get the code** — use a read-only *deploy key*, never a password or token inside the URL:
   ```bash
   git clone git@github.com:YOUR-ORG/de_baat_trading.git /opt/de-baat && cd /opt/de-baat
   ```
5. **Configure:**
   ```bash
   cp .env.production.example .env.production && chmod 600 .env.production && nano .env.production
   printf 'SITE_DOMAIN=debaattrading.nl\nNEXT_PUBLIC_SITE_URL=https://debaattrading.nl\n' > .env
   ```
   Photos need no setting: they go to the `uploads` volume.
6. **Start:**
   ```bash
   docker compose up -d --build
   docker compose ps                       # app should say "healthy"
   curl https://debaattrading.nl/api/health?deep=1
   ```
   Caddy fetches the HTTPS certificate on first start (DNS must already point at the server).

**Updating:** `cd /opt/de-baat && git pull && docker compose up -d --build`

**Logs:** `docker compose logs -f app`

**Backups:** the database is Neon's job (check its restore window). Photos live in a Docker volume:
```bash
docker run --rm -v de-baat_uploads:/data -v "$PWD":/backup busybox tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```
(Volume name = `<folder name>_uploads`; confirm with `docker volume ls`.) Copy the file off the server regularly.

**Monitoring:** point a free uptime checker (UptimeRobot etc.) at `/api/health`.

---------------------------------------------------------------------------------------------------

## C. Vercel
Import the repo, add the variables from section 0 plus `BLOB_READ_WRITE_TOKEN` (Storage → Create → Blob, public), redeploy.
The free Hobby plan is for non-commercial use; a business shop should use a paid plan.

---------------------------------------------------------------------------------------------------

## After any deploy — checklist
- [ ] `/api/health?deep=1` says `database: ok`
- [ ] `/admin` login works for each admin; "Ingelogd als …" shows the right e-mail
- [ ] Add a test product with a photo → it appears on the public site → delete it
- [ ] Place a test order → the owner **and** the customer receive an email
- [ ] The contact form and the "sell your machine" form deliver
- [ ] Dutch and English pages both load; the phone menu opens
- [ ] `NEXT_PUBLIC_SITE_URL` matches the real address (sitemap at `/sitemap.xml`)

## Troubleshooting
| Symptom | Likely cause |
| --- | --- |
| Admin says "login not set up" | `ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH` missing, or `AUTH_SECRET` shorter than 32 characters. |
| "Incorrect" with the right password | The hash got a line break or truncated when pasted. Re-copy it from a file. |
| Admin shows "database can't be reached" | `DATABASE_URL` wrong or the Neon password was changed. The message under it says which. |
| "Photo uploads aren't set up" | No `GCS_BUCKET` / `UPLOAD_DIR` / `BLOB_READ_WRITE_TOKEN` in production. |
| Checkout / forms show an error | SMTP not configured (or wrong). Check the logs for `mail failed`. |
| Public pages look stale after an edit | Up to ~1 minute with more than one instance; otherwise redeploy. |
