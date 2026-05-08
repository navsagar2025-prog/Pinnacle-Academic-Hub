/**
 * GET /api/v1/admin/analytics/realtime
 * Returns the number of active users in the last 30 minutes from GA4 realtime API.
 * Falls back to 0 if credentials are not configured.
 */
import { ok, err } from "@/lib/server/api-response";
import { getDbUser } from "@/lib/server/portal-auth";
import { getGa4Credentials, getRealtimeActiveUsers } from "@/lib/server/ga4";

export async function GET() {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden", 403);

  const creds = await getGa4Credentials();
  if (!creds) return ok({ activeUsers: null, configured: false });

  const activeUsers = await getRealtimeActiveUsers(creds);
  return ok({ activeUsers, configured: true });
}
