import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { questionBank } from "@workspace/db/schema";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { logQbAuditBulk } from "@/lib/server/question-bank-deletion";

// Bulk "request deletion" — used by teacher/examiner UI when flagging many
// questions at once. Each row keeps its existing requester if already
// flagged (so re-flagging by a different teacher only updates the reason).
export async function POST(req: NextRequest) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "Provide an `ids` array" }, { status: 400 });
  }
  const reason = (body.reason ?? "").toString().trim();
  if (!reason) return NextResponse.json({ error: "A reason is required" }, { status: 400 });
  if (reason.length > 1000) return NextResponse.json({ error: "Reason is too long (max 1000 chars)" }, { status: 400 });
  if (body.ids.length > 1000) return NextResponse.json({ error: "Max 1000 questions per request" }, { status: 400 });

  const ids: string[] = body.ids.filter((x: unknown): x is string => typeof x === "string" && x.length > 0);

  // Stamp every matching, non-deleted row. COALESCE preserves the original
  // requester for already-flagged rows. RETURNING gives us the actual
  // affected IDs so audit + response reflect reality, not the input list.
  const updated = await db.update(questionBank)
    .set({
      deletionRequestedAt: sql`coalesce(${questionBank.deletionRequestedAt}, now())`,
      deletionRequestedBy: sql`coalesce(${questionBank.deletionRequestedBy}, ${user.id})`,
      deletionReason: reason,
      updatedAt: new Date(),
    })
    .where(and(inArray(questionBank.id, ids), isNull(questionBank.deletedAt)))
    .returning({ id: questionBank.id });
  const affectedIds = updated.map((r) => r.id);

  if (affectedIds.length > 0) {
    await logQbAuditBulk({
      actorId: user.id,
      actorName: user.name,
      action: "qb.delete.requested",
      ids: affectedIds,
      details: { reason, bulk: true },
    });
  }

  return NextResponse.json({
    success: true,
    requested: affectedIds.length,
    skipped: ids.length - affectedIds.length,
  });
}
