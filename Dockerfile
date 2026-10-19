# syntax=docker/dockerfile:1
# De Baat Trading — production image (Next.js "standalone" output).
#   docker build -t de-baat .
#   docker run -p 8080:8080 --env-file .env.production -v de-baat-uploads:/data/uploads de-baat

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS build
WORKDIR /app
# Baked into the pages at build time (sitemap, share previews). Override with --build-arg.
ARG NEXT_PUBLIC_SITE_URL=https://debaattrading.nl
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# No database or secrets are needed to build: if the database is unreachable the build uses the starter catalog
# and pages refresh from the real database at runtime.
RUN npm run build

FROM node:22-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=8080 HOSTNAME=0.0.0.0 UPLOAD_DIR=/data/uploads
# Non-root user; /data/uploads is where photos go when UPLOAD_DIR is used (mount a volume there on a VPS).
RUN useradd --system --uid 1001 --home /app nextjs && mkdir -p /data/uploads && chown -R nextjs /data /app
COPY --from=build --chown=nextjs /app/public ./public
COPY --from=build --chown=nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs /app/.next/static ./.next/static
USER nextjs
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
