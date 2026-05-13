import { db } from "@workspace/db";
import { feeRecords, students, parents, users, siteSettings, auditLogs } from "@workspace/db/schema";
import { eq, and, gte, lte, or } from "drizzle-orm";
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

    const [siteRow] = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, "site_name"))
      .limit(1);
    const _centreName = siteRow?.value ?? "Pinnacle Academic Classes";

    for (const record of dueSoon) {
      if (!record.studentId) continue;

      const amountDue = record.amount - record.paidAmount;
      if (amountDue <= 0) continue;

      const studentId = record.studentId;

      // Idempotency: check audit_logs for a same-day reminder already sent
      // for this fee record. Survives process restarts and multi-instance runs.
      const existingLogs = await db
        .select({ details: auditLogs.details })
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.action, "fee_reminder_sent"),
            eq(auditLogs.entityType, "fee_record"),
            eq(auditLogs.entityId, record.id),
          ),
        );
      const alreadySentToday = existingLogs.some(
        (l) => (l.details as { date?: string } | null)?.date === reminderDateKey,
      );
      if (alreadySentToday) {
        logger.debug({ recordId: record.id, reminderDateKey }, "Skipping already-sent reminder");
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

      const recipients: Array<{ name: string; email: string }> = [];
      if (studentUser?.email) {
        recipients.push({ name: studentUser.name ?? "Student", email: studentUser.email });
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
        if (pu?.email) {
          recipients.push({ name: pu.name ?? "Parent", email: pu.email });
        }
      }

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

      // Record the send so future runs (including same-day restarts) skip this record.
      if (sentCount > 0) {
        await db.insert(auditLogs).values({
          action: "fee_reminder_sent",
          entityType: "fee_record",
          entityId: record.id,
          details: { date: reminderDateKey, recipients: sentCount },
        });
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
