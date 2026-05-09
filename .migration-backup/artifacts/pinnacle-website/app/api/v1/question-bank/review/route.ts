import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { questionBank } from "@workspace/db/schema";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";

// AI review-queue actions: approve (sets review_status='approved' and
// is_published=true) or reject (soft-deletes the row by setting deleted_at).
// Either accepts a small `ids` array or a `bulk` flag with `subject` /
// `difficulty` filters that mirror the review queue page.
export async function POST(req: NextRequest) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const action = body.action;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  // Per-row mode.
  const ids: unknown = body.ids;
  if (Array.isArray(ids) && ids.length > 0) {
    if (ids.length > 500) return NextResponse.json({ error: "Max 500 ids per request" }, { status: 400 });
    const cleanIds = ids.map((x) => String(x));
    const baseWhere = and(
      inArray(questionBank.id, cleanIds),
      eq(questionBank.reviewStatus, "pending"),
      eq(questionBank.source, "AI"),
      isNull(questionBank.deletedAt),
    );
    if (action === "approve") {
      const updated = await db.update(questionBank)
        .set({ reviewStatus: "approved", isPublished: true, updatedAt: new Date() })
        .where(baseWhere)
        .returning({ id: questionBank.id });
      return NextResponse.json({ success: true, action, affected: updated.length });
    }
    // Reject = soft-delete so the row leaves the queue but is recoverable from
    // the existing pending-deletions / bin workflow if the team changes its mind.
    const updated = await db.update(questionBank)
      .set({
        reviewStatus: "rejected",
        deletedAt: new Date(),
        deletionReason: body.reason ? String(body.reason).slice(0, 500) : "AI review: rejected",
        deletionRequestedBy: user.id,
        deletionRequestedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(baseWhere)
      .returning({ id: questionBank.id });
    return NextResponse.json({ success: true, action, affected: updated.length });
  }

  // Bulk mode — approve every pending AI question matching the filter.
  if (body.bulk === true) {
    if (action !== "approve") {
      return NextResponse.json({ error: "Bulk reject is not allowed; review individually." }, { status: 400 });
    }
    const conds = [
      eq(questionBank.reviewStatus, "pending"),
      eq(questionBank.source, "AI"),
      isNull(questionBank.deletedAt),
    ];
    if (body.subject && typeof body.subject === "string") {
      conds.push(eq(questionBank.subject, body.subject));
    }
    if (body.difficulty && ["easy", "medium", "hard"].includes(body.difficulty)) {
      conds.push(eq(questionBank.difficulty, body.difficulty as "easy" | "medium" | "hard"));
    }
    // Hard cap so a single bulk-approve can't accidentally publish 10K+ rows.
    const [{ pendingCount }] = await db
      .select({ pendingCount: sql<number>`count(*)::int` })
      .from(questionBank)
      .where(and(...conds));
    if (pendingCount > 1000) {
      return NextResponse.json({
        error: `${pendingCount} rows match — too many for bulk approve. Add tighter filters (subject + difficulty) and try again.`,
      }, { status: 400 });
    }
    const updated = await db.update(questionBank)
      .set({ reviewStatus: "approved", isPublished: true, updatedAt: new Date() })
      .where(and(...conds))
      .returning({ id: questionBank.id });
    return NextResponse.json({ success: true, action: "approve", bulk: true, affected: updated.length });
  }

  return NextResponse.json({ error: "Provide either `ids: [...]` or `bulk: true` with filters" }, { status: 400 });
}
