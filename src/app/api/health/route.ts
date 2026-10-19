import { getStore } from "@/lib/store";

// Liveness for load balancers / Cloud Run / Docker.  GET /api/health        → { ok: true }
// Add ?deep=1 to also check the database.             GET /api/health?deep=1 → 503 if the database is down
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get("deep") !== "1") return Response.json({ ok: true });
  try {
    await getStore().listAll();
    return Response.json({ ok: true, database: "ok" });
  } catch {
    return Response.json({ ok: false, database: "unreachable" }, { status: 503 });
  }
}
