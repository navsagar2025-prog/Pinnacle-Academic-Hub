import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import { classRecordings, recordingStreamTokens, students } from "@workspace/db/schema";
import { eq, and, isNull, gt, sql } from "drizzle-orm";
import { getDbUser } from "@/lib/server/portal-auth";
import { logAudit } from "@/lib/server/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip");
}

function studentHasAccess(
  rec: { batchId: string | null; batchIds: string[] | null },
  studentBatchId: string | null,
) {
  if (!studentBatchId) return false;
  const ids = rec.batchIds ?? [];
  if (ids.includes(studentBatchId)) return true;
  if (rec.batchId && rec.batchId === studentBatchId) return true;
  return false;
}

// GET /api/v1/recordings/[id]/stream?token=...
// Validates the short-lived token, then 302-redirects to the underlying
// source URL. The source URL is *never* sent to the browser as a string in
// any HTML/JSON payload — only as a one-shot Location header.
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  if (!token) return new NextResponse("Missing token", { status: 400 });

  const user = await getDbUser();
  if (!user) return new NextResponse("Not signed in", { status: 401 });

  const reqIp = getClientIp(req);

  // ATOMIC single-use claim: the conditional update only matches when the
  // token is unconsumed AND unexpired AND owned by this user AND for this
  // recording. If the row count is 0 the token is invalid / expired /
  // already used — refuse without leaking which.
  const claimed = await db
    .update(recordingStreamTokens)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(recordingStreamTokens.token, token),
        eq(recordingStreamTokens.recordingId, id),
        eq(recordingStreamTokens.userId, user.id),
        isNull(recordingStreamTokens.consumedAt),
        gt(recordingStreamTokens.expiresAt, sql`now()`),
      ),
    )
    .returning();
  const tok = claimed[0];
  if (!tok) {
    await logAudit(user.id, user.name, "recording.stream_url_rejected", "class_recording", id, {
      reason: "invalid_or_consumed",
      ip: reqIp,
    });
    return new NextResponse("Invalid, expired, or already-used token", { status: 403 });
  }

  // IP binding: when the token was issued with an IP and the redemption
  // request also has one, they must match. We allow redemption when either
  // side is missing (e.g. the issuing request was behind a proxy chain
  // that stripped the header) so a legitimate viewer isn't locked out.
  if (tok.ip && reqIp && tok.ip !== reqIp) {
    await logAudit(user.id, user.name, "recording.stream_url_rejected", "class_recording", id, {
      reason: "ip_mismatch",
      tokenIp: tok.ip,
      requestIp: reqIp,
    });
    return new NextResponse("Forbidden (IP mismatch)", { status: 403 });
  }

  const [rec] = await db.select().from(classRecordings).where(eq(classRecordings.id, id)).limit(1);
  if (!rec || rec.archivedAt || !rec.isVisible) {
    return new NextResponse("Not available", { status: 404 });
  }

  // Re-check access at redirect time. Enrolment, role, or visibility could
  // have changed in the 5-minute window — re-validate so a revoked
  // student cannot ride a pre-issued token to the source URL.
  if (user.role === "student") {
    const [enrol] = await db
      .select({ batchId: students.batchId })
      .from(students)
      .where(and(eq(students.userId, user.id), eq(students.isActive, true)))
      .limit(1);
    if (!studentHasAccess(rec, enrol?.batchId ?? null)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  } else if (user.role !== "admin" && user.role !== "teacher") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  await logAudit(user.id, user.name, "recording.play_start", "class_recording", rec.id, {
    ip: reqIp,
    userAgent: req.headers.get("user-agent"),
  });

  // 302 (not 307) so caches treat it as transient. Add no-store explicitly
  // so intermediaries never persist the Location.
  return NextResponse.redirect(rec.recordingUrl, {
    status: 302,
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate, private" },
  });
}
