import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";
import { env } from "./env";

/**
 * Where uploaded product photos go — chosen by which environment variable is set:
 *   BLOB_READ_WRITE_TOKEN → Vercel Blob            (works from any host)
 *   GCS_BUCKET            → Google Cloud Storage   (Cloud Run: no key needed, the service account is used)
 *   UPLOAD_DIR            → a folder on the server (a VPS with a persistent disk; served by /uploads/…)
 *   none, in development  → ./.data/uploads        (zero setup on your own machine)
 */
type Provider = "blob" | "gcs" | "local";

const isProd = () => process.env.NODE_ENV === "production";

export function storageProvider(): Provider | null {
  if (env("BLOB_READ_WRITE_TOKEN")) return "blob";
  if (env("GCS_BUCKET")) return "gcs";
  if (env("UPLOAD_DIR") || !isProd()) return "local";
  return null;
}

export const imageStorageReady = () => storageProvider() !== null;

export const uploadDir = () => env("UPLOAD_DIR") ?? path.join(process.cwd(), ".data", "uploads");

const BLOB_HOST = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;
const gcsPrefix = () => (env("GCS_BUCKET") ? `https://storage.googleapis.com/${env("GCS_BUCKET")}/` : null);

/** Only URLs we could have produced ourselves may be stored on a product. */
export const isAllowedImageUrl = (u: string) =>
  u.startsWith("/products/") || /^\/uploads\/[\w.-]+$/.test(u) || BLOB_HOST.test(u) || (!!gcsPrefix() && u.startsWith(gcsPrefix()!));

async function gcsBucket() {
  // Loaded on demand: the library is large and only needed on the Google Cloud route.
  const { Storage } = await import("@google-cloud/storage");
  return new Storage().bucket(env("GCS_BUCKET")!);
}

export async function saveImage(file: Blob): Promise<string> {
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const provider = storageProvider();

  if (provider === "blob") {
    const blob = await put(`products/${name}`, file, {
      access: "public",
      contentType: "image/jpeg",
      addRandomSuffix: false,
      token: env("BLOB_READ_WRITE_TOKEN"),
    });
    return blob.url;
  }

  if (provider === "gcs") {
    await (await gcsBucket()).file(`products/${name}`).save(Buffer.from(await file.arrayBuffer()), {
      resumable: false,
      contentType: "image/jpeg",
      metadata: { cacheControl: "public, max-age=31536000, immutable" },
    });
    return `${gcsPrefix()}products/${name}`;
  }

  if (provider === "local") {
    await fs.mkdir(/*turbopackIgnore: true*/ uploadDir(), { recursive: true });
    await fs.writeFile(path.join(/*turbopackIgnore: true*/ uploadDir(), name), Buffer.from(await file.arrayBuffer()));
    return `/uploads/${name}`;
  }

  throw new Error("Photo storage is not configured (set BLOB_READ_WRITE_TOKEN, GCS_BUCKET or UPLOAD_DIR).");
}

/** Best-effort cleanup of photos that are no longer used. Starter-catalog photos in /products are never touched. */
export async function deleteImages(urls: string[]) {
  try {
    const blobs = urls.filter((u) => BLOB_HOST.test(u));
    if (blobs.length && env("BLOB_READ_WRITE_TOKEN")) await del(blobs, { token: env("BLOB_READ_WRITE_TOKEN") });

    const prefix = gcsPrefix();
    const gcs = prefix ? urls.filter((u) => u.startsWith(prefix)) : [];
    if (gcs.length) {
      const bucket = await gcsBucket();
      await Promise.all(gcs.map((u) => bucket.file(u.slice(prefix!.length)).delete({ ignoreNotFound: true })));
    }

    for (const u of urls.filter((x) => /^\/uploads\/[\w.-]+$/.test(x))) {
      await fs.rm(path.join(/*turbopackIgnore: true*/ uploadDir(), path.basename(u)), { force: true });
    }
  } catch (e) {
    console.error("[images] cleanup failed", e);
  }
}
