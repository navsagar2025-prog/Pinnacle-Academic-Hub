import { NextRequest } from "next/server";
import { db } from "@workspace/db";
import { classRecordings, students } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { getDbUser } from "@/lib/server/portal-auth";
import { ok, err } from "@/lib/server/api-response";
import { logAudit } from "@/lib/server/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_EVENTS = new Set(["play_seek", "watermark_removed"]);

function getClientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip");
}

// POST /api/v1/recordings/[id]/telemetry — small client beacon for events
// that the stream proxy can't see (seek, overlay-removal-detected). Cheap
// and best-effort; failures are swallowed by the caller. We still gate on
// the same access rules as the stream endpoint so the audit log can't be
// poisoned by an unauthorised user emitting fake events for arbitrary IDs.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user) return err("Not signed in", 401);
  const { id } = await ctx.params;

  let body: { event?: string; positionSec?: number };
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON", 400);
  }
  const event = body.event ?? "";
  if (!VALID_EVENTS.has(event)) return err("Unknown event", 400);

  const [rec] = await db
    .select({
      id: classRecordings.id,
      batchId: classRecordings.batchId,
      batchIds: classRecordings.batchIds,
      isVisible: classRecordings.isVisible,
      archivedAt: classRecordings.archivedAt,
    })
    .from(classRecordings)
    .where(eq(classRecordings.id, id))
    .limit(1);
  if (!rec || rec.archivedAt || !rec.isVisible) return err("Not found", 404);

  if (user.role === "student") {
    const [enrol] = await db
      .select({ batchId: students.batchId })
      .from(students)
      .where(and(eq(students.userId, user.id), eq(students.isActive, true)))
      .limit(1);
    const sb = enrol?.batchId ?? null;
    const inArrayMatch = sb && (rec.batchIds ?? []).includes(sb);
    const legacyMatch = sb && rec.batchId && rec.batchId === sb;
    if (!inArrayMatch && !legacyMatch) return err("Forbidden", 403);
  } else if (user.role !== "admin" && user.role !== "teacher") {
    return err("Forbidden", 403);
  }

  await logAudit(user.id, user.name, `recording.${event}`, "class_recording", rec.id, {
    recordingId: rec.id,
    viewerId: user.id,
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent"),
    positionSec: typeof body.positionSec === "number" ? body.positionSec : undefined,
  });
  return ok({ logged: true });
}
