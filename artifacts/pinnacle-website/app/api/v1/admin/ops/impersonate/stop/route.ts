import { getRealAdminUser } from "@/lib/server/portal-auth";
import { ok, err } from "@/lib/server/api-response";
import {
  endImpersonationByToken,
  IMPERSONATION_COOKIE,
} from "@/lib/server/impersonation";
import { logAudit } from "@/lib/server/audit";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST() {
  const actor = await getRealAdminUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden", 403);

  const cookieStore = await cookies();
  const raw = cookieStore.get(IMPERSONATION_COOKIE)?.value;

  let endedSessionId: string | null = null;
  if (raw) {
    endedSessionId = await endImpersonationByToken(raw, "manual_stop");
  }
  cookieStore.delete(IMPERSONATION_COOKIE);

  if (endedSessionId) {
    await logAudit(actor.id, actor.name, "ops.impersonate.stop", "impersonation_session", endedSessionId, {
      reason: "manual_stop",
    });
  }
  return ok({ stopped: !!endedSessionId });
}
