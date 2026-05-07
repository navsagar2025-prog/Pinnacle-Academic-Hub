import { getRealAdminUser } from "@/lib/server/portal-auth";
import { ok, err } from "@/lib/server/api-response";
import { getHealthSnapshot } from "@/lib/server/ops-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const actor = await getRealAdminUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden", 403);

  const force = new URL(request.url).searchParams.get("force") === "1";
  try {
    const snap = await getHealthSnapshot(force);
    return ok(snap);
  } catch (e) {
    console.error("ops/health error:", e);
    return err((e as Error).message);
  }
}
