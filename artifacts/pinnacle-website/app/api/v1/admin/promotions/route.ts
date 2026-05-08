/**
 * GET /api/v1/admin/promotions
 *
 * Admin-only. Returns ALL promotions including archived ones, for the admin
 * management UI. Supports ?showArchived=true to include archived rows.
 */
import { db } from "@workspace/db";
import { promotions } from "@workspace/db/schema";
import { isNull, desc } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";
import { getDbUser } from "@/lib/server/portal-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden — admin only", 403);

  const { searchParams } = new URL(request.url);
  const showArchived = searchParams.get("showArchived") === "true";

  try {
    const rows = await db
      .select()
      .from(promotions)
      .where(showArchived ? undefined : isNull(promotions.archivedAt))
      .orderBy(desc(promotions.createdAt));

    return ok(rows);
  } catch (e) {
    console.error("GET /api/v1/admin/promotions error:", e);
    return err("Failed to fetch promotions");
  }
}
