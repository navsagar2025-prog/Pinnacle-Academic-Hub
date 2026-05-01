import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { seoOverrides } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";

export async function GET() {
  const dbUser = await getDbUser();
  if (!dbUser) return err("Unauthorized", 401);
  if (dbUser.role !== "admin") return err("Forbidden", 403);

  try {
    const rows = await db.select().from(seoOverrides);
    return ok(rows);
  } catch (e) {
    console.error("GET /api/v1/seo error:", e);
    return err("Failed to fetch SEO overrides");
  }
}

export async function PUT(request: Request) {
  const dbUser = await getDbUser();
  if (!dbUser) return err("Unauthorized", 401);
  if (dbUser.role !== "admin") return err("Forbidden", 403);

  let body: { route?: string; title?: string; description?: string; focusKeyword?: string; noIndex?: boolean };
  try { body = await request.json(); } catch { return err("Invalid JSON", 400); }

  const { route, title, description, focusKeyword, noIndex } = body;
  if (!route?.trim()) return err("route is required", 400);

  try {
    const [existing] = await db
      .select({ id: seoOverrides.id })
      .from(seoOverrides)
      .where(eq(seoOverrides.route, route));

    let result;
    if (existing) {
      [result] = await db
        .update(seoOverrides)
        .set({
          title: title?.trim() || null,
          description: description?.trim() || null,
          focusKeyword: focusKeyword?.trim() || null,
          noIndex: noIndex ?? false,
          updatedAt: new Date(),
        })
        .where(eq(seoOverrides.route, route))
        .returning();
    } else {
      [result] = await db
        .insert(seoOverrides)
        .values({
          route,
          title: title?.trim() || null,
          description: description?.trim() || null,
          focusKeyword: focusKeyword?.trim() || null,
          noIndex: noIndex ?? false,
        })
        .returning();
    }

    return ok(result);
  } catch (e) {
    console.error("PUT /api/v1/seo error:", e);
    return err("Failed to save SEO override");
  }
}

export async function DELETE(request: Request) {
  const dbUser = await getDbUser();
  if (!dbUser) return err("Unauthorized", 401);
  if (dbUser.role !== "admin") return err("Forbidden", 403);

  const { searchParams } = new URL(request.url);
  const route = searchParams.get("route");
  if (!route) return err("route query param is required", 400);

  try {
    await db.delete(seoOverrides).where(eq(seoOverrides.route, route));
    return ok({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/v1/seo error:", e);
    return err("Failed to delete SEO override");
  }
}
