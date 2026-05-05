import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { questionBank } from "@workspace/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { logQbAudit } from "@/lib/server/question-bank-deletion";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  // Excludes soft-deleted rows from the public/portal read path.
  const [q] = await db.select().from(questionBank)
    .where(and(eq(questionBank.id, id), isNull(questionBank.deletedAt)))
    .limit(1);
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, question: q });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of ["subject", "topic", "classGrade", "difficulty", "questionType", "questionText", "correctAnswer", "solution", "imageUrl", "solutionImageUrl", "examName", "isPublished"] as const) {
    if (k in body) updates[k] = body[k];
  }
  if ("year" in body) updates.year = body.year ? Number(body.year) : null;
  if ("marks" in body) updates.marks = body.marks ? Number(body.marks) : 4;
  if ("options" in body) updates.options = body.options ?? null;

  // Edits never touch a soft-deleted row.
  await db.update(questionBank).set(updates)
    .where(and(eq(questionBank.id, id), isNull(questionBank.deletedAt)));
  return NextResponse.json({ success: true });
}

// DELETE = ADMIN-ONLY soft-delete.
// Teachers/examiners must use POST /api/v1/question-bank/[id]/deletion-request
// (the API refuses their DELETE so a future teacher UI can't accidentally
// hard-delete via the REST surface).
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can delete questions. Teachers may request a deletion instead." },
      { status: 403 },
    );
  }
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const ack = url.searchParams.get("ackNoTeacherRequest") === "1";

  const [existing] = await db.select().from(questionBank)
    .where(and(eq(questionBank.id, id), isNull(questionBank.deletedAt)))
    .limit(1);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Refuse the call if no teacher requested it AND the admin hasn't passed
  // the explicit acknowledgement flag — UI shows the warning modal first.
  if (!existing.deletionRequestedAt && !ack) {
    return NextResponse.json({
      error: "no_teacher_request",
      message: "No teacher has requested this deletion. Re-send the request with ?ackNoTeacherRequest=1 to confirm.",
    }, { status: 409 });
  }

  // Conditional update: if another admin already deleted the row between
  // our SELECT and UPDATE, the WHERE clause matches zero rows and we surface
  // a 409 instead of double-logging an approval.
  const updated = await db.update(questionBank)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(questionBank.id, id), isNull(questionBank.deletedAt)))
    .returning({ id: questionBank.id });
  if (updated.length === 0) {
    return NextResponse.json({ error: "Already deleted by another admin" }, { status: 409 });
  }

  await logQbAudit({
    actorId: user.id,
    actorName: user.name,
    action: "qb.delete.approved",
    entityId: id,
    details: {
      hadTeacherRequest: !!existing.deletionRequestedAt,
      requestedBy: existing.deletionRequestedBy,
      reason: existing.deletionReason,
    },
  });

  return NextResponse.json({ success: true });
}
