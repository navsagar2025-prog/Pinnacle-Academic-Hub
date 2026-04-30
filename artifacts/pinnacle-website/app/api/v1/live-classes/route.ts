import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@workspace/db";
import { liveClasses, batches, users, teachers, students } from "@workspace/db/schema";
import { eq, desc, sql, and, gte, inArray } from "drizzle-orm";
import { createZoomMeeting } from "@/lib/services/zoom";

async function getDbUser(clerkUserId: string) {
  const [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  return user ?? null;
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const dbUser = await getDbUser(userId);
  if (!dbUser) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

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
      if (!enrollment?.batchId) {
        return NextResponse.json({ success: true, data: [], meta: { total: 0, page, limit, pages: 0 } });
      }
      conditions.push(eq(liveClasses.batchId, enrollment.batchId) as ReturnType<typeof eq>);
    } else if (dbUser.role === "teacher") {
      const [teacher] = await db
        .select({ id: teachers.id })
        .from(teachers)
        .where(and(eq(teachers.userId, dbUser.id), eq(teachers.isActive, true)))
        .limit(1);
      if (!teacher) {
        return NextResponse.json({ success: true, data: [], meta: { total: 0, page, limit, pages: 0 } });
      }
      conditions.push(eq(liveClasses.teacherId, teacher.id) as ReturnType<typeof eq>);
    } else if (dbUser.role === "parent") {
      return NextResponse.json({ success: true, data: [], meta: { total: 0, page, limit, pages: 0 } });
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

    return NextResponse.json({
      success: true,
      data: rows,
      meta: { total: count, page, limit, pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    console.error("GET /api/v1/live-classes error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch live classes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const dbUser = await getDbUser(userId);
  if (!dbUser || (dbUser.role !== "teacher" && dbUser.role !== "admin")) {
    return NextResponse.json({ success: false, error: "Forbidden: Only teachers and admins can schedule classes" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { topic, subject, batchId, scheduledAt, durationMinutes } = body;

    if (!topic || !batchId || !scheduledAt) {
      return NextResponse.json({ success: false, error: "topic, batchId, and scheduledAt are required" }, { status: 400 });
    }

    let resolvedTeacherId: string | null = null;

    if (dbUser.role === "teacher") {
      const [teacher] = await db
        .select({ id: teachers.id })
        .from(teachers)
        .where(and(eq(teachers.userId, dbUser.id), eq(teachers.isActive, true)))
        .limit(1);
      if (!teacher) {
        return NextResponse.json({ success: false, error: "Teacher profile not found" }, { status: 403 });
      }
      resolvedTeacherId = teacher.id;
    } else if (dbUser.role === "admin") {
      resolvedTeacherId = body.teacherId ?? null;
    }

    const meeting = await createZoomMeeting({
      topic,
      scheduledAt: new Date(scheduledAt),
      durationMinutes: durationMinutes ?? 90,
    });

    const [created] = await db
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

    return NextResponse.json({ success: true, data: { ...created, zoomHostUrl: meeting.hostUrl } }, { status: 201 });
  } catch (err) {
    console.error("POST /api/v1/live-classes error:", err);
    return NextResponse.json({ success: false, error: "Failed to create live class" }, { status: 500 });
  }
}
