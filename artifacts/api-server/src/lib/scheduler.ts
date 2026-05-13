import { db } from "@workspace/db";
import { feeRecords, students, parents, users, siteSettings, auditLogs } from "@workspace/db/schema";
import { eq, and, gte, lte, or, sql } from "drizzle-orm";
import { emailAvailable, sendEmail, buildFeeReminderEmail } from "./email.js";
import { logger } from "./logger.js";

const PORTAL_URL = process.env.PORTAL_URL ?? process.env.WEBSITE_BASE_URL ?? "https://pinnacle.edu.in/portal";

async function sendFeeReminders(): Promise<void> {
  if (!emailAvailable()) return;

  const now = new Date();
  // Target records due exactly 3 days from today.
  const threeDaysAhead = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);
  const threeDaysAheadEnd = new Date(threeDaysAhead);
  threeDaysAheadEnd.setHours(23, 59, 59, 999);

  // Key stored in audit_logs.details to deduplicate per record per due-date
  // window across process restarts and multi-instance runs.
  const reminderDateKey = threeDaysAhead.toISOString().slice(0, 10);

  try {
    const dueSoon = await db
      .select({
        id: feeRecords.id,
        period: feeRecords.period,
        amount: feeRecords.amount,
        paidAmount: feeRecords.paidAmount,
        dueDate: feeRecords.dueDate,
        status: feeRecords.status,
        studentId: feeRecords.studentId,
      })
      .from(feeRecords)
      .where(
        and(
          or(eq(feeRecords.status, "due"), eq(feeRecords.status, "overdue")),
          gte(feeRecords.dueDate, threeDaysAhead),
          lte(feeRecords.dueDate, threeDaysAheadEnd),
        ),
      );

    if (dueSoon.length === 0) return;

    for (const record of dueSoon) {
      if (!record.studentId) continue;

      const amountDue = record.amount - record.paidAmount;
      if (amountDue <= 0) continue;

      const studentId = record.studentId;

      // Atomic idempotency claim using INSERT WHERE NOT EXISTS.
      // This is race-safe across restarts and multi-instance runs without
      // requiring a unique index on audit_logs.
      // rowCount == 0  → another instance already claimed this record today → skip.
      // rowCount > 0   → we own the send for this record+day → proceed.
      const claimResult = await db.execute(sql`
        INSERT INTO audit_logs (id, action, entity_type, entity_id, details, created_at)
        SELECT gen_random_uuid(),
               'fee_reminder_sent',
               'fee_record',
               ${record.id},
               ${JSON.stringify({ date: reminderDateKey })}::jsonb,
               NOW()
        WHERE NOT EXISTS (
          SELECT 1 FROM audit_logs
          WHERE action       = 'fee_reminder_sent'
            AND entity_type  = 'fee_record'
            AND entity_id    = ${record.id}
            AND details->>'date' = ${reminderDateKey}
        )
      `);
      if ((claimResult.rowCount ?? 0) === 0) {
        logger.debug({ recordId: record.id, reminderDateKey }, "Skipping already-claimed reminder");
        continue;
      }

      const dueDateStr = record.dueDate
        ? new Date(record.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
        : "";

      const [studentRow] = await db
        .select({ userId: students.userId })
        .from(students)
        .where(eq(students.id, studentId))
        .limit(1);

      if (!studentRow?.userId) continue;

      const [studentUser] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, studentRow.userId))
        .limit(1);

      // Build recipient list, deduplicating by email address to prevent
      // double-sends when a parent user also shares the student's email.
      const recipientMap = new Map<string, { name: string; email: string }>();
      if (studentUser?.email) {
        recipientMap.set(studentUser.email.toLowerCase(), {
          name: studentUser.name ?? "Student",
          email: studentUser.email,
        });
      }

      const parentRows = await db
        .select({ userId: parents.userId })
        .from(parents)
        .where(eq(parents.studentId, studentId));

      for (const pr of parentRows) {
        if (!pr.userId) continue;
        const [pu] = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, pr.userId))
          .limit(1);
        if (pu?.email && !recipientMap.has(pu.email.toLowerCase())) {
          recipientMap.set(pu.email.toLowerCase(), { name: pu.name ?? "Parent", email: pu.email });
        }
      }

      const recipients = Array.from(recipientMap.values());

      let sentCount = 0;
      for (const recipient of recipients) {
        try {
          const { subject, html } = buildFeeReminderEmail({
            recipientName: recipient.name,
            studentName: studentUser?.name ?? "Student",
            period: record.period,
            amountDue,
            dueDate: dueDateStr,
            portalUrl: PORTAL_URL,
          });
          await sendEmail({ to: recipient.email, subject, html });
          sentCount++;
        } catch (err) {
          logger.warn({ err, recordId: record.id, to: recipient.email }, "Fee reminder email failed");
        }
      }

      // If every send attempt failed, release the idempotency claim so the
      // next scheduler run can retry (transient provider outage scenario).
      if (sentCount === 0 && recipients.length > 0) {
        await db.execute(sql`
          DELETE FROM audit_logs
          WHERE action      = 'fee_reminder_sent'
            AND entity_type = 'fee_record'
            AND entity_id   = ${record.id}
            AND details->>'date' = ${reminderDateKey}
        `);
        logger.warn({ recordId: record.id }, "All reminder sends failed; claim released for retry");
      }
    }

    logger.info({ count: dueSoon.length }, "Fee reminder emails processed");
  } catch (err) {
    logger.error({ err }, "Fee reminder scheduler error");
  }
}

export function startFeeReminderScheduler(): void {
  const RUN_INTERVAL_MS = 24 * 60 * 60 * 1000;

  sendFeeReminders().catch((err) => logger.error({ err }, "Initial fee reminder run failed"));

  setInterval(() => {
    sendFeeReminders().catch((err) => logger.error({ err }, "Scheduled fee reminder run failed"));
  }, RUN_INTERVAL_MS);

  logger.info("Fee reminder scheduler started (daily)");
}
