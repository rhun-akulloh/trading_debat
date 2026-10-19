import { isAdmin } from "@/lib/auth";
import { imageStorageReady, saveImage } from "@/lib/images";

const MAX_BYTES = 4 * 1024 * 1024; // under Vercel's ~4.5 MB request limit; the browser shrinks photos first

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });

  // Belt and braces on top of SameSite=Lax cookies.
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return Response.json({ error: "forbidden" }, { status: 403 });

  if (!imageStorageReady()) return Response.json({ error: "storage_not_configured" }, { status: 503 });

  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "no_file" }, { status: 400 });
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return Response.json({ error: "bad_type" }, { status: 415 });
  if (file.size > MAX_BYTES) return Response.json({ error: "too_large" }, { status: 413 });

  try {
    return Response.json({ url: await saveImage(file) });
  } catch (e) {
    console.error("[upload]", e);
    return Response.json({ error: "save_failed" }, { status: 500 });
  }
}
