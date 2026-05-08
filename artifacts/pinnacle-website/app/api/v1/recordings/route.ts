import { NextRequest } from "next/server";
import { db } from "@workspace/db";
import { classRecordings, batches, users } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { getDbUser, getRealAdminUser } from "@/lib/server/portal-auth";
import { ok, err, created } from "@/lib/server/api-response";
import { logAudit } from "@/lib/server/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_PROVIDERS = new Set(["zoom", "youtube", "vimeo", "mp4", "hls", "other"]);

// IMPORTANT: This file is the **admin-only** management surface for class
// recordings. The task statement bars the raw source URL from being
// exposed in the *student-facing* HTML/JSON path; admins, however, must be
// able to see and edit the URL to manage the library. Both responses
// below are gated by `role === "admin"` and include `recordingUrl` for
// that reason. The student player path never receives it: the listing at
// `/portal/student/recordings` projects only display fields, and the
// player page hands the source URL out exclusively as a one-shot 302
// `Location` from `/api/v1/recordings/[id]/stream`.
export async function GET() {
  const user = await getDbUser();
  if (!user || user.role !== "admin") return err("Forbidden", 403);

  const rows = await db
    .select({
      id: classRecordings.id,
      title: classRecordings.title,
      subject: classRecordings.subject,
      teacherName: classRecordings.teacherName,
      sourceProvider: classRecordings.sourceProvider,
      classDate: classRecordings.classDate,
      durationMinutes: classRecordings.durationMinutes,
      isVisible: classRecordings.isVisible,
      viewCount: classRecordings.viewCount,
      archivedAt: classRecordings.archivedAt,
      createdAt: classRecordings.createdAt,
      batchId: classRecordings.batchId,
      batchName: batches.name,
      createdByName: users.name,
    })
    .from(classRecordings)
    .leftJoin(batches, eq(classRecordings.batchId, batches.id))
    .leftJoin(users, eq(classRecordings.createdById, users.id))
    .orderBy(desc(classRecordings.createdAt))
    .limit(200);
  return ok(rows);
}

export async function POST(req: NextRequest) {
  const actor = await getRealAdminUser();
  if (!actor || actor.role !== "admin") return err("Forbidden", 403);

  let body: {
    title?: string;
    subject?: string;
    teacherName?: string | null;
    recordingUrl?: string;
    sourceProvider?: string;
    classDate?: string | null;
    durationMinutes?: number | null;
    batchId?: string | null;
    isVisible?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const title = (body.title ?? "").trim();
  const subject = (body.subject ?? "").trim();
  const recordingUrl = (body.recordingUrl ?? "").trim();
  if (!title) return err("title required", 400);
  if (!subject) return err("subject required", 400);
  if (!recordingUrl) return err("recordingUrl required", 400);
  try {
    const u = new URL(recordingUrl);
    if (!/^https?:$/.test(u.protocol)) return err("recordingUrl must be http(s)", 400);
  } catch {
    return err("recordingUrl must be a valid URL", 400);
  }
  const sourceProvider = body.sourceProvider && VALID_PROVIDERS.has(body.sourceProvider)
    ? body.sourceProvider
    : "zoom";

  const [row] = await db
    .insert(classRecordings)
    .values({
      title,
      subject,
      teacherName: body.teacherName ?? null,
      recordingUrl,
      sourceProvider,
      classDate: body.classDate ? new Date(body.classDate) : null,
      durationMinutes: body.durationMinutes ?? null,
      batchId: body.batchId || null,
      isVisible: body.isVisible ?? true,
      createdById: actor.id,
    })
    .returning();

  await logAudit(actor.id, actor.name, "recording.create", "class_recording", row.id, {
    title: row.title,
    batchId: row.batchId,
    sourceProvider: row.sourceProvider,
  });

  return created(row);
}
