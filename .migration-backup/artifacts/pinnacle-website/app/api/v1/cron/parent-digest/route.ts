import { NextRequest, NextResponse } from "next/server";
import { buildParentDigest, listDigestRecipients } from "@/lib/server/parent-digest";
import { sendWeeklyParentDigest } from "@/lib/server/email";

export const dynamic = "force-dynamic";

/**
 * Weekly parent digest cron endpoint.
 * Protected by `CRON_SECRET` (or, if unset, by the `Bearer` admin trigger from
 * the settings page). To run weekly, schedule a cron hitting:
 *   POST {SITE}/api/v1/cron/parent-digest   Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Fail-closed: never accept unauthenticated requests, even in dev.
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not configured on the server" },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const recipients = await listDigestRecipients();
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const errors: Array<{ parentId: string; error: string }> = [];

  for (const parentId of recipients) {
    try {
      const data = await buildParentDigest(parentId);
      if (!data) { skipped++; continue; }
      const result = await sendWeeklyParentDigest({
        to: data.parentEmail,
        parentName: data.parentName,
        studentName: data.studentName,
        weekStart: data.weekStart,
        weekEnd: data.weekEnd,
        attendance: data.attendance,
        mockTests: data.mockTests,
        upcomingClasses: data.upcomingClasses,
        pendingFees: data.pendingFees,
      });
      if (result.ok) sent++;
      else { failed++; errors.push({ parentId, error: result.error ?? "unknown" }); }
    } catch (e) {
      failed++;
      errors.push({ parentId, error: e instanceof Error ? e.message : "unknown" });
    }
  }

  return NextResponse.json({
    ok: true,
    totalRecipients: recipients.length,
    sent,
    skipped,
    failed,
    errors: errors.slice(0, 10),
  });
}
