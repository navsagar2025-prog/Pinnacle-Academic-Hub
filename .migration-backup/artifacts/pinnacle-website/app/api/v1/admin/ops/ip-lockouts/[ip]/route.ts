/**
 * DELETE /api/v1/admin/ops/ip-lockouts/[ip] — manually unblock an IP (admin only)
 */
import { NextRequest } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { unblockIp } from "@/lib/server/security-events";
import { ok, err } from "@/lib/server/api-response";
import { logAudit } from "@/lib/server/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ ip: string }> },
) {
  const user = await getDbUser();
  if (!user || user.role !== "admin") return err("Forbidden", 403);

  const { ip } = await params;
  const decodedIp = decodeURIComponent(ip);

  const success = await unblockIp(decodedIp, user.email);
  if (!success) return err("IP not found or already unblocked", 404);

  await logAudit(user.id, user.name, "security.ip_unblock", "ip_lockout", decodedIp, {
    unblockedBy: user.email,
  });

  return ok({ ip: decodedIp, unblocked: true });
}
