import { listPublic } from "@/lib/store";

// Lightweight product info for the cart (ids live in the browser's localStorage).
export async function GET(req: Request) {
  const ids = new Set((new URL(req.url).searchParams.get("ids") ?? "").split(",").filter(Boolean).slice(0, 50));
  const items = (await listPublic())
    .filter((p) => ids.has(p.id) && p.status === "published")
    .map((p) => ({ id: p.id, slug: p.slug, article: p.article, title: p.title, kind: p.kind, price: p.price, image: p.images[0] }));
  return Response.json(items, { headers: { "Cache-Control": "no-store" } });
}
