/**
 * POST /api/v1/admin/analytics/ga4-test
 * Tests GA4 credentials supplied in the request body.
 * Used by the Analytics settings section "Test Connection" button.
 */
import { ok, err } from "@/lib/server/api-response";
import { getDbUser } from "@/lib/server/portal-auth";
import { testGa4Connection } from "@/lib/server/ga4";

export async function POST(req: Request) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden", 403);

  const body = await req.json().catch(() => ({})) as {
    propertyId?: string;
    serviceAccountJson?: string;
  };

  if (!body.propertyId || !body.serviceAccountJson) {
    return err("propertyId and serviceAccountJson are required", 400);
  }

  const result = await testGa4Connection({
    propertyId: body.propertyId,
    serviceAccountJson: body.serviceAccountJson,
  });

  return ok(result);
}
