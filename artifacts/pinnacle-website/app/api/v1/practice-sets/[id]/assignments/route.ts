import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { practiceSetAssignments } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";

function isStaff(role: string | undefined) {
  return role === "admin" || role === "teacher";
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user || !isStaff(user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: setId } = await params;

  let body: { batchId?: string | null; studentId?: string | null; dueAt?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const batchId = body.batchId?.toString().trim() || null;
  const studentId = body.studentId?.toString().trim() || null;
  if (!batchId && !studentId) {
    return NextResponse.json({ error: "Either batchId or studentId is required" }, { status: 400 });
  }
  if (batchId && studentId) {
    return NextResponse.json({ error: "Provide batchId or studentId, not both" }, { status: 400 });
  }

  // de-dupe identical assignments
  const dupCond = batchId
    ? and(eq(practiceSetAssignments.setId, setId), eq(practiceSetAssignments.batchId, batchId))
    : and(eq(practiceSetAssignments.setId, setId), eq(practiceSetAssignments.studentId, studentId!));
  const [existing] = await db
    .select({ id: practiceSetAssignments.id })
    .from(practiceSetAssignments)
    .where(dupCond)
    .limit(1);
  if (existing) {
    // Update the dueAt instead of creating a duplicate
    if (body.dueAt !== undefined) {
      await db
        .update(practiceSetAssignments)
        .set({ dueAt: body.dueAt ? new Date(body.dueAt) : null })
        .where(eq(practiceSetAssignments.id, existing.id));
    }
    return NextResponse.json({ id: existing.id, updated: true });
  }

  const [created] = await db
    .insert(practiceSetAssignments)
    .values({
      setId,
      batchId,
      studentId,
      assignedBy: user.id,
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
    })
    .returning();
  return NextResponse.json({ assignment: created }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user || !isStaff(user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: setId } = await params;
  const url = new URL(req.url);
  const assignmentId = url.searchParams.get("assignmentId");
  if (!assignmentId) return NextResponse.json({ error: "assignmentId required" }, { status: 400 });
  await db
    .delete(practiceSetAssignments)
    .where(and(eq(practiceSetAssignments.id, assignmentId), eq(practiceSetAssignments.setId, setId)));
  return NextResponse.json({ ok: true });
}
