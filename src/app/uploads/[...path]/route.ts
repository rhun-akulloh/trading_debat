import fs from "node:fs/promises";
import path from "node:path";
import { uploadDir } from "@/lib/images";

// Serves photos uploaded to a folder on the server (UPLOAD_DIR). Next.js only serves files that existed at
// build time from /public, so photos added later need a route.
const TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

export async function GET(_req: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const { path: parts } = await ctx.params;
  const name = parts.join("/");
  // one flat folder, plain file names only — no path traversal
  if (parts.length !== 1 || !/^[\w.-]+$/.test(name) || name.startsWith(".")) return new Response("Not found", { status: 404 });
  const type = TYPES[path.extname(name).toLowerCase()];
  if (!type) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(path.join(/*turbopackIgnore: true*/ uploadDir(), name));
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
