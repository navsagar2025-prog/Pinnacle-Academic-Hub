import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import { studentTestResults } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { getDbUser } from "@/lib/server/portal-auth";
import { logAudit } from "@/lib/server/audit";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getDbUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized — admin only" }, { status: 403 });
  }

  const { id } = await params;
  let body: {
    examName?: string;
    subject?: string;
    totalMarks?: number;
    marksObtained?: number;
    rank?: string;
    examDate?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { examName, subject, totalMarks, marksObtained, rank, examDate } = body;

  if (
    typeof totalMarks === "number" &&
    typeof marksObtained === "number" &&
    (marksObtained < 0 || marksObtained > totalMarks)
  ) {
    return NextResponse.json({ error: "marksObtained must be between 0 and totalMarks" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (examName) updates.examName = examName.trim();
  if (subject) updates.subject = subject.trim();
  if (typeof totalMarks === "number") updates.totalMarks = totalMarks;
  if (typeof marksObtained === "number") updates.marksObtained = marksObtained;
  if (rank !== undefined) updates.rank = rank?.trim() || null;
  if (examDate) updates.examDate = new Date(examDate);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(studentTestResults)
    .set(updates as Partial<typeof studentTestResults.$inferInsert>)
    .where(eq(studentTestResults.id, id))
    .returning({ id: studentTestResults.id });

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  logAudit(user.id, user.name ?? "admin", "update", "student_test_result", id).catch(console.error);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getDbUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized — admin only" }, { status: 403 });
  }

  const { id } = await params;
  const [deleted] = await db
    .delete(studentTestResults)
    .where(eq(studentTestResults.id, id))
    .returning({ id: studentTestResults.id });

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  logAudit(user.id, user.name ?? "admin", "delete", "student_test_result", id).catch(console.error);
  return NextResponse.json({ success: true });
}
