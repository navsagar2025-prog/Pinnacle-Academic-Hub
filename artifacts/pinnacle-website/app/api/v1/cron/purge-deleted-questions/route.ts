import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questionBank, auditLogs } from "@workspace/db/schema";
import { and, isNotNull, lt, sql } from "drizzle-orm";
import {
  PURGE_AFTER_DAYS,
  PURGE_CRON_AUDIT_ENTITY_ID,
  logQbAuditBulk,
} from "@/lib/server/question-bank-deletion";

export const dynamic = "force-dynamic";

/**
 * Daily cron: hard-deletes question_bank rows whose deletedAt is older than
 * PURGE_AFTER_DAYS. There is intentionally NO admin UI to trigger this
 * directly — the only path to permanent removal is the 7-day timer.
 *
 *   POST {SITE}/api/v1/cron/purge-deleted-questions
 *   Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not configured on the server" },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - PURGE_AFTER_DAYS * 24 * 60 * 60 * 1000);
  const purged = await db.delete(questionBank)
    .where(and(isNotNull(questionBank.deletedAt), lt(questionBank.deletedAt, sql`${cutoff}`)))
    .returning({ id: questionBank.id });

  await logQbAuditBulk({
    actorId: null,
    actorName: "system:purge-cron",
    action: "qb.delete.purged",
    ids: purged.map((p) => p.id),
    details: { cutoff: cutoff.toISOString() },
  });

  // Always record a heartbeat row so admins can confirm the daily job is alive,
  // even on days when zero rows were eligible for purge.
  await db.insert(auditLogs).values({
    actorId: null,
    actorName: "system:purge-cron",
    action: "qb.delete.cron_run",
    entityType: "cron",
    entityId: PURGE_CRON_AUDIT_ENTITY_ID,
    details: {
      purged: purged.length,
      cutoff: cutoff.toISOString(),
      purgeAfterDays: PURGE_AFTER_DAYS,
    },
  });

  console.log(`[purge-deleted-questions] purged ${purged.length} questions older than ${PURGE_AFTER_DAYS}d`);
  return NextResponse.json({ ok: true, purged: purged.length, cutoff: cutoff.toISOString() });
}
