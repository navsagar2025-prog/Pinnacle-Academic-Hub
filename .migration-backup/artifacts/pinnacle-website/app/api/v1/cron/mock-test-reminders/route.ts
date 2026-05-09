import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  mockTests,
  mockTestNotifications,
  mockTestQuestions,
  students,
  users,
} from "@workspace/db/schema";
import { and, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { sendMockTestReminder } from "@/lib/server/email";

export const dynamic = "force-dynamic";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";
const SITE_URL = `https://${process.env.REPLIT_DEV_DOMAIN ?? "pinnacleacademic.in"}${BASE_PATH}`;

interface RunSummary {
  scanned: number;
  notified: number;
  recipients: number;
  skipped: number;
  errors: string[];
}

async function runReminders(): Promise<{ open: RunSummary; startingSoon: RunSummary }> {
  const now = new Date();
  // "open" window: scheduledStart in the last 5 minutes (catches missed cron ticks).
  const openLowerBound = new Date(now.getTime() - 5 * 60 * 1000);
  // "starting_soon" window: 50–70 minutes before scheduledStart.
  const soonLowerBound = new Date(now.getTime() + 50 * 60 * 1000);
  const soonUpperBound = new Date(now.getTime() + 70 * 60 * 1000);

  const open = await processBatch("open", openLowerBound, now);
  const startingSoon = await processBatch("starting_soon", soonLowerBound, soonUpperBound);
  return { open, startingSoon };
}

async function processBatch(
  kind: "open" | "starting_soon",
  lowerBound: Date,
  upperBound: Date,
): Promise<RunSummary> {
  const summary: RunSummary = { scanned: 0, notified: 0, recipients: 0, skipped: 0, errors: [] };

  const rows = await db
    .select({
      id: mockTests.id,
      title: mockTests.title,
      subject: mockTests.subject,
      durationMinutes: mockTests.durationMinutes,
      batchId: mockTests.batchId,
      scheduledStart: mockTests.scheduledStart,
      scheduledEnd: mockTests.scheduledEnd,
      questionCount: sql<number>`(select count(*)::int from ${mockTestQuestions} where ${mockTestQuestions.testId} = ${mockTests.id})`,
    })
    .from(mockTests)
    .where(
      and(
        eq(mockTests.isPublished, true),
        isNotNull(mockTests.scheduledStart),
        gte(mockTests.scheduledStart, lowerBound),
        lte(mockTests.scheduledStart, upperBound),
      ),
    );

  summary.scanned = rows.length;

  for (const test of rows) {
    if (!test.scheduledStart) continue;
    if (Number(test.questionCount) === 0) {
      summary.skipped += 1;
      continue;
    }

    // Idempotency claim: only one process can insert (testId, kind).
    let claimed = false;
    try {
      const inserted = await db
        .insert(mockTestNotifications)
        .values({ testId: test.id, kind, recipientCount: 0 })
        .onConflictDoNothing({ target: [mockTestNotifications.testId, mockTestNotifications.kind] })
        .returning({ id: mockTestNotifications.id });
      claimed = inserted.length > 0;
    } catch (e) {
      summary.errors.push(`claim-failed:${test.id}:${e instanceof Error ? e.message : String(e)}`);
      continue;
    }

    if (!claimed) {
      summary.skipped += 1;
      continue;
    }

    // Look up recipients. We only notify enrolled students of a specific batch.
    // Public/un-batched tests have no enrolled audience to email.
    if (!test.batchId) {
      summary.skipped += 1;
      continue;
    }

    const recipientRows = await db
      .select({
        userId: students.userId,
        name: users.name,
        email: users.email,
      })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .where(and(eq(students.batchId, test.batchId), eq(students.isActive, true)));

    const recipients = recipientRows.filter((r) => r.email && r.email.includes("@"));

    if (recipients.length === 0) {
      // No-one to email — keep the claim so we don't keep retrying every minute.
      summary.skipped += 1;
      continue;
    }

    const testUrl = `${SITE_URL}/portal/student/mock-tests/${test.id}/take`;
    let sent = 0;
    let failed = 0;
    for (const r of recipients) {
      const result = await sendMockTestReminder({
        to: r.email,
        studentName: r.name ?? undefined,
        testTitle: test.title,
        subject: test.subject,
        durationMinutes: test.durationMinutes,
        scheduledStart: test.scheduledStart,
        scheduledEnd: test.scheduledEnd,
        testUrl,
        kind,
      });
      if (result.ok) sent += 1;
      else {
        failed += 1;
        summary.errors.push(`send-failed:${test.id}:${r.email}:${result.error ?? "unknown"}`);
      }
    }

    if (sent === 0) {
      // Roll back the claim so we retry on the next tick.
      await db
        .delete(mockTestNotifications)
        .where(and(eq(mockTestNotifications.testId, test.id), eq(mockTestNotifications.kind, kind)));
      summary.errors.push(`all-failed:${test.id}:${failed}-recipients`);
      continue;
    }

    // Update the recipient count on the (already-claimed) notification row.
    await db
      .update(mockTestNotifications)
      .set({ recipientCount: sent })
      .where(and(eq(mockTestNotifications.testId, test.id), eq(mockTestNotifications.kind, kind)));

    summary.notified += 1;
    summary.recipients += sent;
    console.info(
      `[mock-test-reminders] ${kind} test=${test.id} sent=${sent} failed=${failed} batch=${test.batchId}`,
    );
  }

  return summary;
}

function authorize(req: Request): { ok: true } | { ok: false; status: number; message: string } {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    // Fail closed in production. In development we allow unauthenticated runs
    // so the endpoint is easy to hit locally without configuration.
    if (process.env.NODE_ENV === "production") {
      return { ok: false, status: 503, message: "CRON_SECRET not configured" };
    }
    return { ok: true };
  }
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : null;
  const xCron = req.headers.get("x-cron-secret");
  if (bearer === expected || xCron === expected) {
    return { ok: true };
  }
  return { ok: false, status: 401, message: "Unauthorized" };
}

async function handle(req: Request): Promise<Response> {
  const auth = authorize(req);
  if (!auth.ok) return NextResponse.json({ success: false, error: auth.message }, { status: auth.status });
  try {
    const result = await runReminders();
    return NextResponse.json({ success: true, ranAt: new Date().toISOString(), ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[mock-test-reminders] fatal:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function GET(req: Request): Promise<Response> {
  return handle(req);
}

export async function POST(req: Request): Promise<Response> {
  return handle(req);
}
