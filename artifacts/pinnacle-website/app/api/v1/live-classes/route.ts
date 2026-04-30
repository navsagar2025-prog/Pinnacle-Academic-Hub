import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@workspace/db";
import { liveClasses, batches, users, teachers } from "@workspace/db/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { createZoomMeeting } from "@/lib/services/zoom";

async function getDbUser(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.clerkUserId, userId)).limit(1);
  return user ?? null;
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get("batchId");
  const upcomingOnly = searchParams.get("upcoming") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;

  try {
    const conditions = batchId ? [eq(liveClasses.batchId, batchId)] : [];
    if (upcomingOnly) conditions.push(gte(liveClasses.scheduledAt, new Date()));

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
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(liveClasses.scheduledAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(liveClasses)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

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
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { topic, subject, batchId, teacherId, scheduledAt, durationMinutes } = body;

    if (!topic || !batchId || !scheduledAt) {
      return NextResponse.json({ success: false, error: "topic, batchId, and scheduledAt are required" }, { status: 400 });
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
        teacherId: teacherId ?? null,
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
