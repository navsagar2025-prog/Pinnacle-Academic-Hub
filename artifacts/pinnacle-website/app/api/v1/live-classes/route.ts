import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { liveClasses, batches, users, teachers, students } from "@workspace/db/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { createZoomMeeting } from "@/lib/services/zoom";
import { paginatedOk, created, err } from "@/lib/server/api-response";

export async function GET(request: Request) {
  const dbUser = await getDbUser();
  if (!dbUser) return err("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const upcomingOnly = searchParams.get("upcoming") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;

  try {
    const conditions: ReturnType<typeof eq>[] = [];
    if (upcomingOnly) conditions.push(gte(liveClasses.scheduledAt, new Date()) as ReturnType<typeof eq>);

    if (dbUser.role === "student") {
      const [enrollment] = await db
        .select({ batchId: students.batchId })
        .from(students)
        .where(and(eq(students.userId, dbUser.id), eq(students.isActive, true)))
        .limit(1);
      if (!enrollment?.batchId) return paginatedOk([], 0, page, limit);
      conditions.push(eq(liveClasses.batchId, enrollment.batchId) as ReturnType<typeof eq>);
    } else if (dbUser.role === "teacher") {
      const [teacher] = await db
        .select({ id: teachers.id })
        .from(teachers)
        .where(and(eq(teachers.userId, dbUser.id), eq(teachers.isActive, true)))
        .limit(1);
      if (!teacher) return paginatedOk([], 0, page, limit);
      conditions.push(eq(liveClasses.teacherId, teacher.id) as ReturnType<typeof eq>);
    } else if (dbUser.role === "parent") {
      return paginatedOk([], 0, page, limit);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: liveClasses.id,
        topic: liveClasses.topic,
        subject: liveClasses.subject,
        zoomMeetingId: liveClasses.zoomMeetingId,
        zoomJoinUrl: liveClasses.zoomJoinUrl,
        zoomPasscode: liveClasses.zoomPasscode,
        scheduledAt: liveClasses.scheduledAt,
        status: liveClasses.status,
        durationMinutes: liveClasses.durationMinutes,
        recordingUrl: liveClasses.recordingUrl,
        batchName: batches.name,
        teacherName: users.name,
      })
      .from(liveClasses)
      .leftJoin(batches, eq(liveClasses.batchId, batches.id))
      .leftJoin(teachers, eq(liveClasses.teacherId, teachers.id))
      .leftJoin(users, eq(teachers.userId, users.id))
      .where(whereClause)
      .orderBy(desc(liveClasses.scheduledAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(liveClasses)
      .where(whereClause);

    return paginatedOk(rows, count, page, limit);
  } catch (e) {
    console.error("GET /api/v1/live-classes error:", e);
    return err("Failed to fetch live classes");
  }
}

export async function POST(request: Request) {
  const dbUser = await getDbUser();
  if (!dbUser) return err("Unauthorized", 401);
  if (dbUser.role !== "teacher" && dbUser.role !== "admin") {
    return err("Forbidden: Only teachers and admins can schedule classes", 403);
  }

  try {
    const body = await request.json();
    const { topic, subject, batchId, scheduledAt, durationMinutes } = body;
    if (!topic || !batchId || !scheduledAt) {
      return err("topic, batchId, and scheduledAt are required", 400);
    }

    let resolvedTeacherId: string | null = null;

    if (dbUser.role === "teacher") {
      const [teacher] = await db
        .select({ id: teachers.id })
        .from(teachers)
        .where(and(eq(teachers.userId, dbUser.id), eq(teachers.isActive, true)))
        .limit(1);
      if (!teacher) return err("Teacher profile not found", 403);
      resolvedTeacherId = teacher.id;
    } else if (dbUser.role === "admin") {
      resolvedTeacherId = body.teacherId ?? null;
    }

    const meeting = await createZoomMeeting({
      topic,
      scheduledAt: new Date(scheduledAt),
      durationMinutes: durationMinutes ?? 90,
    });

    const [row] = await db
      .insert(liveClasses)
      .values({
        topic,
        subject,
        batchId,
        teacherId: resolvedTeacherId,
        zoomMeetingId: meeting.meetingId,
        zoomJoinUrl: meeting.joinUrl,
        zoomHostUrl: meeting.hostUrl,
        zoomPasscode: meeting.passcode,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: durationMinutes ?? 90,
        status: "scheduled",
      })
      .returning();

    return created({ ...row, zoomHostUrl: meeting.hostUrl });
  } catch (e) {
    console.error("POST /api/v1/live-classes error:", e);
    return err("Failed to create live class");
  }
}
