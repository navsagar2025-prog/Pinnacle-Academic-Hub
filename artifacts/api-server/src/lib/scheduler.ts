import { db } from "@workspace/db";
import { feeRecords, students, parents, users, siteSettings } from "@workspace/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { emailAvailable, sendEmail, buildFeeReminderEmail } from "./email.js";
import { logger } from "./logger.js";

const PORTAL_URL = process.env.PORTAL_URL ?? process.env.WEBSITE_BASE_URL ?? "https://pinnacle.edu.in/portal";

async function sendFeeReminders(): Promise<void> {
  if (!emailAvailable()) return;

  const now = new Date();
  // Target records due exactly 3 days from today — natural idempotency:
  // tomorrow the same record will be 2 days away and won't match again.
  const threeDaysAhead = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);
  const threeDaysAheadEnd = new Date(threeDaysAhead);
  threeDaysAheadEnd.setHours(23, 59, 59, 999);

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
          eq(feeRecords.status, "due"),
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

      const dueDateStr = record.dueDate
        ? new Date(record.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
        : "";

      const studentId = record.studentId;

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
        } catch (err) {
          logger.warn({ err, recordId: record.id, to: recipient.email }, "Fee reminder email failed");
        }
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
