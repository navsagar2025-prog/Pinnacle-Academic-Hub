import { db } from "@workspace/db";
import { siteSettings } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";
import { getDbUser } from "@/lib/server/portal-auth";
import { logAudit } from "@/lib/server/audit";

export async function GET() {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden", 403);

  try {
    const rows = await db.select().from(siteSettings).orderBy(siteSettings.key);
    return ok(rows);
  } catch (e) {
    console.error("GET /api/v1/settings error:", e);
    return err("Failed to fetch settings");
  }
}

export async function PUT(request: Request) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden", 403);

  try {
    const body = await request.json() as Record<string, string>;

    const updates = await Promise.all(
      Object.entries(body).map(async ([key, value]) => {
        const [row] = await db
          .insert(siteSettings)
          .values({ key, value, label: key, updatedAt: new Date() })
          .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } })
          .returning();
        return row;
      })
    );

    await logAudit(actor.id, actor.name, "settings.update", "siteSettings", undefined, { keys: Object.keys(body) });
    return ok(updates);
  } catch (e) {
    console.error("PUT /api/v1/settings error:", e);
    return err("Failed to update settings");
  }
}
