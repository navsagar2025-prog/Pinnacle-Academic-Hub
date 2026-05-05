import { NextResponse } from "next/server";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { buildParentDigest, listDigestRecipients } from "@/lib/server/parent-digest";
import { sendWeeklyParentDigest } from "@/lib/server/email";
import { logAudit } from "@/lib/server/audit";

export const dynamic = "force-dynamic";

/**
 * Admin-only endpoint to manually fire the weekly parent digest.
 * Auth is the admin's portal session — no shared secret crosses the browser.
 */
export async function POST() {
  const admin = await requirePortalRole("admin");
  const recipients = await listDigestRecipients();
  let sent = 0, skipped = 0, failed = 0;
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

  await logAudit(
    admin.id,
    admin.name,
    "settings.update",
    "parent_digest",
    undefined,
    { trigger: "manual", sent, skipped, failed, totalRecipients: recipients.length },
  );

  return NextResponse.json({
    ok: true,
    totalRecipients: recipients.length,
    sent, skipped, failed,
    errors: errors.slice(0, 10),
  });
}
