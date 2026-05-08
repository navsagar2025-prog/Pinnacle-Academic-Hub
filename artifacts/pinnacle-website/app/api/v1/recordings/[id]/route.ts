import { NextRequest } from "next/server";
import { db } from "@workspace/db";
import { classRecordings } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { getRealAdminUser } from "@/lib/server/portal-auth";
import { ok, err } from "@/lib/server/api-response";
import { logAudit } from "@/lib/server/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_PROVIDERS = new Set(["zoom", "youtube", "vimeo", "mp4", "hls", "other"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normaliseBatchIds(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null;
  const out: string[] = [];
  for (const v of input) {
    if (typeof v === "string" && UUID_RE.test(v) && !out.includes(v)) out.push(v);
  }
  return out;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actor = await getRealAdminUser();
  if (!actor || actor.role !== "admin") return err("Forbidden", 403);
  const { id } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const patch: Partial<typeof classRecordings.$inferInsert> = { updatedAt: new Date() };
  if (typeof body.title === "string") patch.title = body.title.trim();
  if (typeof body.subject === "string") patch.subject = body.subject.trim();
  if (body.teacherName === null || typeof body.teacherName === "string")
    patch.teacherName = (body.teacherName as string | null) ?? null;
  if (typeof body.recordingUrl === "string") {
    try {
      const u = new URL(body.recordingUrl);
      if (!/^https?:$/.test(u.protocol)) return err("recordingUrl must be http(s)", 400);
    } catch {
      return err("recordingUrl must be a valid URL", 400);
    }
    patch.recordingUrl = body.recordingUrl.trim();
  }
  if (typeof body.sourceProvider === "string" && VALID_PROVIDERS.has(body.sourceProvider)) {
    patch.sourceProvider = body.sourceProvider;
  }
  if (body.classDate === null || typeof body.classDate === "string") {
    patch.classDate = body.classDate ? new Date(body.classDate as string) : null;
  }
  if (body.durationMinutes === null || typeof body.durationMinutes === "number") {
    patch.durationMinutes = (body.durationMinutes as number | null) ?? null;
  }
  const batchIds = normaliseBatchIds(body.batchIds);
  if (batchIds !== null) {
    if (batchIds.length === 0) return err("At least one batch must be selected", 400);
    patch.batchIds = batchIds;
    patch.batchId = batchIds[0];
  } else if (body.batchId === null || typeof body.batchId === "string") {
    // Legacy single-batch update path — sync both columns.
    const single = (body.batchId as string | null) || null;
    if (single) {
      if (!UUID_RE.test(single)) return err("Invalid batchId", 400);
      patch.batchId = single;
      patch.batchIds = [single];
    }
  }
  if (typeof body.isVisible === "boolean") patch.isVisible = body.isVisible;
  if (body.archived === true) patch.archivedAt = new Date();
  if (body.archived === false) patch.archivedAt = null;

  const [row] = await db.update(classRecordings).set(patch).where(eq(classRecordings.id, id)).returning();
  if (!row) return err("Not found", 404);

  await logAudit(actor.id, actor.name, "recording.update", "class_recording", row.id, {
    archived: !!row.archivedAt,
    isVisible: row.isVisible,
    batchIds: row.batchIds,
  });
  return ok(row);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actor = await getRealAdminUser();
  if (!actor || actor.role !== "admin") return err("Forbidden", 403);
  const { id } = await ctx.params;

  // Soft-archive rather than destroy so audit history + view counts survive.
  const [row] = await db
    .update(classRecordings)
    .set({ archivedAt: new Date(), isVisible: false, updatedAt: new Date() })
    .where(eq(classRecordings.id, id))
    .returning();
  if (!row) return err("Not found", 404);
  await logAudit(actor.id, actor.name, "recording.archive", "class_recording", row.id);
  return ok({ id: row.id, archivedAt: row.archivedAt });
}
