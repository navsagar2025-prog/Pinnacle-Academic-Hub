import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { liveClasses, teachers } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbUser = await getDbUser();
  if (!dbUser) return err("Unauthorized", 401);
  if (dbUser.role !== "teacher" && dbUser.role !== "admin") {
    return err("Forbidden: Only teachers and admins can update classes", 403);
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { meetingUrl, recordingUrl, status } = body as {
      meetingUrl?: string;
      recordingUrl?: string;
      status?: "scheduled" | "live" | "completed" | "cancelled";
    };

    const [existing] = await db
      .select({ id: liveClasses.id, teacherId: liveClasses.teacherId })
      .from(liveClasses)
      .where(eq(liveClasses.id, id))
      .limit(1);

    if (!existing) return err("Live class not found", 404);

    if (dbUser.role === "teacher") {
      const [teacher] = await db
        .select({ id: teachers.id })
        .from(teachers)
        .where(and(eq(teachers.userId, dbUser.id), eq(teachers.isActive, true)))
        .limit(1);
      if (!teacher || existing.teacherId !== teacher.id) {
        return err("Forbidden: You can only update your own classes", 403);
      }
    }

    const setValues: {
      updatedAt: Date;
      zoomJoinUrl?: string | null;
      zoomHostUrl?: string | null;
      recordingUrl?: string | null;
      status?: "scheduled" | "live" | "completed" | "cancelled";
    } = { updatedAt: new Date() };

    if (meetingUrl !== undefined) {
      setValues.zoomJoinUrl = meetingUrl || null;
      setValues.zoomHostUrl = meetingUrl || null;
    }
    if (recordingUrl !== undefined) setValues.recordingUrl = recordingUrl || null;
    if (status !== undefined) setValues.status = status;

    const [updated] = await db
      .update(liveClasses)
      .set(setValues)
      .where(eq(liveClasses.id, id))
      .returning();

    return ok(updated);
  } catch (e) {
    console.error("PATCH /api/v1/live-classes/[id] error:", e);
    return err("Failed to update live class");
  }
}
