/**
 * GET /api/v1/admin/ops/ip-lockouts — list all lockout rows (admin only)
 */
import { NextRequest } from "next/server";
import { db } from "@workspace/db";
import { ipLockouts } from "@workspace/db/schema";
import { getDbUser } from "@/lib/server/portal-auth";
import { ok, err } from "@/lib/server/api-response";
import { desc } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const user = await getDbUser();
  if (!user || user.role !== "admin") return err("Forbidden", 403);

  const rows = await db
    .select()
    .from(ipLockouts)
    .orderBy(desc(ipLockouts.updatedAt))
    .limit(200);

  return ok(
    rows.map((r) => ({
      ...r,
      lockedUntil: r.lockedUntil?.toISOString() ?? null,
      unlockedAt: r.unlockedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      isActive: !r.unlockedAt && !!r.lockedUntil && r.lockedUntil > new Date(),
    })),
  );
}
