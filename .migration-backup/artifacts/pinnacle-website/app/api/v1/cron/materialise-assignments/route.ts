import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import { auditLogs } from "@workspace/db/schema";
import { materialiseAllActive } from "@/lib/server/recurring-assignments";

export const dynamic = "force-dynamic";

/**
 * Daily cron: walks every active assignment_schedule and inserts any missing
 * `assignments` rows up to today + 7 days. Idempotent.
 *
 *   POST {SITE}/api/v1/cron/materialise-assignments
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

  const results = await materialiseAllActive();
  const totalCreated = results.reduce((acc, r) => acc + r.created, 0);
  const totalSkipped = results.reduce((acc, r) => acc + r.skipped, 0);

  await db.insert(auditLogs).values({
    actorId: null,
    actorName: "system:materialise-assignments",
    action: "assignment_schedule.cron_run",
    entityType: "cron",
    entityId: "materialise-assignments",
    details: {
      schedules: results.length,
      created: totalCreated,
      skipped: totalSkipped,
    },
  });

  console.log(
    `[materialise-assignments] schedules=${results.length} created=${totalCreated} skipped=${totalSkipped}`,
  );
  return NextResponse.json({ ok: true, schedules: results.length, created: totalCreated, skipped: totalSkipped, results });
}
