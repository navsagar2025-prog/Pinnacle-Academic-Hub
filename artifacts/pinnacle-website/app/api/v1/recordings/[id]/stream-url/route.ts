import { NextRequest } from "next/server";
import { db } from "@workspace/db";
import { classRecordings, students, recordingStreamTokens } from "@workspace/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getDbUser } from "@/lib/server/portal-auth";
import { ok, err } from "@/lib/server/api-response";
import { logAudit } from "@/lib/server/audit";
import { generateStreamToken, TOKEN_TTL_SECONDS } from "@/lib/server/video-watermark";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

function getClientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip");
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user) return err("Not signed in", 401);
  const { id } = await ctx.params;

  const [rec] = await db.select().from(classRecordings).where(eq(classRecordings.id, id)).limit(1);
  if (!rec || rec.archivedAt || !rec.isVisible) return err("Recording not available", 404);

  // Access check: admins always allowed; teachers always allowed; students
  // must be enrolled in the recording's batch (when one is set).
  if (user.role === "student") {
    if (!rec.batchId) return err("Forbidden", 403);
    const [enrollment] = await db
      .select({ batchId: students.batchId })
      .from(students)
      .where(and(eq(students.userId, user.id), eq(students.isActive, true)))
      .limit(1);
    if (!enrollment || enrollment.batchId !== rec.batchId) return err("Forbidden", 403);
  } else if (user.role !== "admin" && user.role !== "teacher") {
    return err("Forbidden", 403);
  }

  const token = generateStreamToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000);
  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent");

  await db.insert(recordingStreamTokens).values({
    token,
    recordingId: rec.id,
    userId: user.id,
    ip,
    userAgent: ua,
    expiresAt,
  });

  await logAudit(user.id, user.name, "recording.stream_url_issued", "class_recording", rec.id, {
    ip,
    expiresAt: expiresAt.toISOString(),
  });

  // Bump view count (cheap denormalised counter; not security-critical).
  await db.update(classRecordings)
    .set({ viewCount: (rec.viewCount ?? 0) + 1 })
    .where(eq(classRecordings.id, rec.id));

  return ok({
    streamUrl: `${BASE}/api/v1/recordings/${rec.id}/stream?token=${encodeURIComponent(token)}`,
    expiresAt: expiresAt.toISOString(),
    expiresInSeconds: TOKEN_TTL_SECONDS,
  });
}
