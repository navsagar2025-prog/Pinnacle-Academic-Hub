/**
 * GET  /api/v1/promotions   — Public. Returns currently-active promotions for a given audience.
 * POST /api/v1/promotions   — Admin only. Creates a promotion.
 */
import { db } from "@workspace/db";
import { promotions } from "@workspace/db/schema";
import { and, isNull, lte, gte, or, eq, desc } from "drizzle-orm";
import { ok, created, err } from "@/lib/server/api-response";
import { getDbUser } from "@/lib/server/portal-auth";

export const runtime = "nodejs";

function nowTs() {
  return new Date();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const audience = searchParams.get("audience") ?? "public";

  try {
    const now = nowTs();

    const audienceFilter =
      audience === "student"
        ? or(eq(promotions.audience, "student"), eq(promotions.audience, "both"))
        : or(eq(promotions.audience, "public"), eq(promotions.audience, "both"));

    const rows = await db
      .select()
      .from(promotions)
      .where(
        and(
          audienceFilter,
          isNull(promotions.archivedAt),
          lte(promotions.startsAt, now),
          gte(promotions.endsAt, now),
        ),
      )
      .orderBy(desc(promotions.createdAt));

    return ok(rows);
  } catch (e) {
    console.error("GET /api/v1/promotions error:", e);
    return err("Failed to fetch promotions");
  }
}

export async function POST(request: Request) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden — admin only", 403);

  try {
    const body = await request.json();
    const {
      title,
      body: bodyText,
      displayType = "banner",
      audience = "public",
      startsAt,
      endsAt,
      ctaLabel,
      ctaUrl,
      bgColour = "#1a2e5a",
      ctaColour = "#2a9d8f",
    } = body;

    if (!title || !bodyText || !startsAt || !endsAt) {
      return err("title, body, startsAt, and endsAt are required", 400);
    }

    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return err("Invalid date values", 400);
    if (end <= start) return err("endsAt must be after startsAt", 400);

    const [row] = await db
      .insert(promotions)
      .values({
        title,
        body: bodyText,
        displayType,
        audience,
        startsAt: start,
        endsAt: end,
        ctaLabel: ctaLabel || null,
        ctaUrl: ctaUrl || null,
        bgColour,
        ctaColour,
        createdById: actor.id,
      })
      .returning();

    return created(row);
  } catch (e) {
    console.error("POST /api/v1/promotions error:", e);
    return err("Failed to create promotion");
  }
}
