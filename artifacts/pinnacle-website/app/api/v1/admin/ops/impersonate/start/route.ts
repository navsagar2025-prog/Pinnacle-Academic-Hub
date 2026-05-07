import { getRealAdminUser } from "@/lib/server/portal-auth";
import { ok, err } from "@/lib/server/api-response";
import { db } from "@workspace/db";
import { users } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  startImpersonation,
  IMPERSONATION_COOKIE,
  MAX_IMPERSONATION_MINUTES,
} from "@/lib/server/impersonation";
import { logAudit } from "@/lib/server/audit";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const actor = await getRealAdminUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden", 403);

  let body: { targetUserId?: string };
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body", 400);
  }
  const targetUserId = (body.targetUserId ?? "").trim();
  if (!targetUserId) return err("targetUserId required", 400);

  const [target] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
  if (!target) return err("Target user not found", 404);
  if (target.id === actor.id) return err("Cannot impersonate yourself", 400);
  if (target.role === "admin") return err("Impersonating other admins is not allowed", 400);

  try {
    const { rawToken, sessionId, expiresAt } = await startImpersonation(actor.id, target.id);
    const cookieStore = await cookies();
    cookieStore.set(IMPERSONATION_COOKIE, rawToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });
    await logAudit(actor.id, actor.name, "ops.impersonate.start", "user", target.id, {
      sessionId,
      targetName: target.name,
      targetEmail: target.email,
      targetRole: target.role,
      maxMinutes: MAX_IMPERSONATION_MINUTES,
    });
    return ok({
      sessionId,
      target: { id: target.id, name: target.name, email: target.email, role: target.role },
      expiresAt,
    });
  } catch (e) {
    console.error("impersonate.start error:", e);
    return err((e as Error).message);
  }
}
