import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { questionBank } from "@workspace/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { logQbAudit } from "@/lib/server/question-bank-deletion";

// POST = teacher/examiner/admin flags a question for deletion with a reason.
// Idempotent — re-flagging updates the reason and timestamp but doesn't
// disturb the original requester.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const reason = (body?.reason ?? "").toString().trim();
  if (!reason) {
    return NextResponse.json({ error: "A reason is required" }, { status: 400 });
  }
  if (reason.length > 1000) {
    return NextResponse.json({ error: "Reason is too long (max 1000 chars)" }, { status: 400 });
  }

  const [existing] = await db.select({
    id: questionBank.id,
    deletionRequestedAt: questionBank.deletionRequestedAt,
    deletionRequestedBy: questionBank.deletionRequestedBy,
  }).from(questionBank)
    .where(and(eq(questionBank.id, id), isNull(questionBank.deletedAt)))
    .limit(1);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Preserve the original requester so the admin inbox still credits them
  // even if a different teacher updates the reason later.
  const requestedBy = existing.deletionRequestedBy ?? user.id;
  const requestedAt = existing.deletionRequestedAt ?? new Date();

  // Conditional on still-not-deleted to avoid racing an admin approval.
  const updated = await db.update(questionBank)
    .set({
      deletionRequestedAt: requestedAt,
      deletionRequestedBy: requestedBy,
      deletionReason: reason,
      updatedAt: new Date(),
    })
    .where(and(eq(questionBank.id, id), isNull(questionBank.deletedAt)))
    .returning({ id: questionBank.id });
  if (updated.length === 0) {
    return NextResponse.json({ error: "Question was deleted by an admin" }, { status: 409 });
  }

  await logQbAudit({
    actorId: user.id,
    actorName: user.name,
    action: "qb.delete.requested",
    entityId: id,
    details: { reason, originalRequestedBy: requestedBy },
  });

  return NextResponse.json({ success: true });
}

// DELETE = clear the deletion request (admin declines, or the original
// requester withdraws). Soft-deleted rows are out of scope here — use the
// restore endpoint for those.
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const [existing] = await db.select({
    id: questionBank.id,
    deletionRequestedBy: questionBank.deletionRequestedBy,
  }).from(questionBank)
    .where(and(eq(questionBank.id, id), isNull(questionBank.deletedAt)))
    .limit(1);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Teachers can only retract their OWN request; admins can clear anyone's.
  if (user.role === "teacher" && existing.deletionRequestedBy !== user.id) {
    return NextResponse.json({ error: "Only an admin can decline another teacher's request" }, { status: 403 });
  }

  // Same race guard: don't clear governance metadata on a row that another
  // admin just soft-deleted.
  const updated = await db.update(questionBank)
    .set({
      deletionRequestedAt: null,
      deletionRequestedBy: null,
      deletionReason: null,
      updatedAt: new Date(),
    })
    .where(and(eq(questionBank.id, id), isNull(questionBank.deletedAt)))
    .returning({ id: questionBank.id });
  if (updated.length === 0) {
    return NextResponse.json({ error: "Question was deleted by an admin" }, { status: 409 });
  }

  // Optional decline reason — captured here so the audit row carries the
  // admin's "why" alongside the original request reason.
  let declineReason: string | null = null;
  try {
    const body = await req.json();
    const r = (body?.reason ?? "").toString().trim();
    if (r) declineReason = r.slice(0, 1000);
  } catch { /* body optional */ }

  await logQbAudit({
    actorId: user.id,
    actorName: user.name,
    action: "qb.delete.request_cleared",
    entityId: id,
    details: {
      originalRequestedBy: existing.deletionRequestedBy,
      declineReason,
    },
  });

  return NextResponse.json({ success: true });
}
