import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import { assignmentSchedules, batches } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { getDbUser } from "@/lib/server/portal-auth";

export async function GET(_req: NextRequest) {
  const user = await getDbUser();
  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cond = user.role === "admin" ? undefined : eq(assignmentSchedules.postedBy, user.id);
  const rows = await db
    .select({
      id: assignmentSchedules.id,
      title: assignmentSchedules.title,
      subject: assignmentSchedules.subject,
      frequency: assignmentSchedules.frequency,
      daysOfWeek: assignmentSchedules.daysOfWeek,
      dayOfMonth: assignmentSchedules.dayOfMonth,
      intervalDays: assignmentSchedules.intervalDays,
      dueTimeOfDay: assignmentSchedules.dueTimeOfDay,
      startDate: assignmentSchedules.startDate,
      endDate: assignmentSchedules.endDate,
      status: assignmentSchedules.status,
      lastMaterialisedDate: assignmentSchedules.lastMaterialisedDate,
      batchId: assignmentSchedules.batchId,
      batchName: batches.name,
      createdAt: assignmentSchedules.createdAt,
    })
    .from(assignmentSchedules)
    .leftJoin(batches, eq(assignmentSchedules.batchId, batches.id))
    .where(cond)
    .orderBy(desc(assignmentSchedules.createdAt));

  return NextResponse.json({ success: true, data: rows });
}
