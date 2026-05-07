import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import { assignmentSchedules } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { getDbUser } from "@/lib/server/portal-auth";
import { logAudit } from "@/lib/server/audit";
import { validateSchedule, materialiseSchedule } from "@/lib/server/recurring-assignments";

async function loadOwned(id: string, userId: string, role: string) {
  const cond =
    role === "admin"
      ? eq(assignmentSchedules.id, id)
      : and(eq(assignmentSchedules.id, id), eq(assignmentSchedules.postedBy, userId));
  const [row] = await db.select().from(assignmentSchedules).where(cond).limit(1);
  return row ?? null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const row = await loadOwned(id, user.id, user.role);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: row });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await loadOwned(id, user.id, user.role);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: {
    action?: "pause" | "resume" | "end" | "edit";
    title?: string;
    description?: string | null;
    fileUrl?: string | null;
    maxMarks?: number | null;
    frequency?: "daily" | "weekly" | "biweekly" | "monthly" | "custom";
    daysOfWeek?: number[] | null;
    dayOfMonth?: number | null;
    intervalDays?: number | null;
    dueTimeOfDay?: string;
    startDate?: string;
    endDate?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action ?? "edit";

  if (action === "pause" || action === "resume" || action === "end") {
    const status = action === "pause" ? "paused" : action === "resume" ? "active" : "ended";
    await db
      .update(assignmentSchedules)
      .set({ status, updatedAt: new Date() })
      .where(eq(assignmentSchedules.id, id));
    logAudit(user.id, user.name ?? "unknown", action, "assignment_schedule", id, {
      title: existing.title,
    }).catch(console.error);
    if (status === "active") {
      // catch up on any missed occurrences while paused
      await materialiseSchedule(id);
    }
    return NextResponse.json({ success: true, status });
  }

  // edit — only future materialisations use new settings
  const next = {
    title: body.title ?? existing.title,
    description: body.description ?? existing.description,
    fileUrl: body.fileUrl ?? existing.fileUrl,
    maxMarks: body.maxMarks ?? existing.maxMarks,
    frequency: body.frequency ?? existing.frequency,
    daysOfWeek: body.daysOfWeek ?? existing.daysOfWeek,
    dayOfMonth: body.dayOfMonth ?? existing.dayOfMonth,
    intervalDays: body.intervalDays ?? existing.intervalDays,
    dueTimeOfDay: body.dueTimeOfDay ?? existing.dueTimeOfDay,
    startDate: body.startDate ? new Date(body.startDate) : existing.startDate,
    endDate:
      body.endDate === undefined
        ? existing.endDate
        : body.endDate
          ? new Date(body.endDate)
          : null,
  };

  const v = validateSchedule({
    frequency: next.frequency as ScheduleFreq,
    daysOfWeek: next.daysOfWeek ?? undefined,
    dayOfMonth: next.dayOfMonth ?? undefined,
    intervalDays: next.intervalDays ?? undefined,
    dueTimeOfDay: next.dueTimeOfDay,
    startDate: next.startDate.toISOString(),
    endDate: next.endDate ? next.endDate.toISOString() : null,
  });
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  await db
    .update(assignmentSchedules)
    .set({ ...next, updatedAt: new Date() })
    .where(eq(assignmentSchedules.id, id));

  logAudit(user.id, user.name ?? "unknown", "edit", "assignment_schedule", id, {
    title: next.title,
    frequency: next.frequency,
  }).catch(console.error);

  return NextResponse.json({ success: true });
}

type ScheduleFreq = "daily" | "weekly" | "biweekly" | "monthly" | "custom";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await loadOwned(id, user.id, user.role);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft end (don't drop past materialised assignments)
  await db
    .update(assignmentSchedules)
    .set({ status: "ended", updatedAt: new Date() })
    .where(eq(assignmentSchedules.id, id));

  logAudit(user.id, user.name ?? "unknown", "end", "assignment_schedule", id, {
    title: existing.title,
  }).catch(console.error);

  return NextResponse.json({ success: true });
}
