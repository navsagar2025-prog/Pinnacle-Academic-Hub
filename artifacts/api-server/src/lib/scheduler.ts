import { db } from "@workspace/db";
import { feeRecords, students, parents, users, socialPosts } from "@workspace/db/schema";
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
      // A DB-level unique partial index (audit_logs_reminder_dedup_idx) enforces
      // race-safety: if two instances race, one succeeds (rowCount>0) and the
      // other either gets rowCount==0 (sequential) or a PG 23505 unique-violation
      // (truly concurrent). Both "skip" paths are handled below.
      let claimed = false;
      try {
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
        claimed = (claimResult.rowCount ?? 0) > 0;
      } catch (err: unknown) {
        // PG error 23505 = unique_violation: another instance claimed concurrently.
        if (typeof err === "object" && err !== null && (err as { code?: string }).code === "23505") {
          logger.debug({ recordId: record.id, reminderDateKey }, "Concurrent claim lost; skipping");
        } else {
          throw err; // unexpected error — let outer catch handle it
        }
      }
      if (!claimed) {
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

// ── Scheduled social post processor ──────────────────────────────────────────
// Checks every minute for social posts whose scheduled_at has passed and
// transitions them to "published". Actual platform API calls require
// configuring SOCIAL_FACEBOOK_TOKEN, SOCIAL_INSTAGRAM_TOKEN,
// SOCIAL_TWITTER_TOKEN, and SOCIAL_LINKEDIN_TOKEN environment variables —
// without these the post is marked published in the DB without a live URL.

async function publishScheduledPosts(): Promise<void> {
  const now = new Date();
  try {
    const due = await db.select({ id: socialPosts.id, content: socialPosts.content, platformTargets: socialPosts.platformTargets })
      .from(socialPosts)
      .where(and(eq(socialPosts.status, "scheduled"), lte(socialPosts.scheduledAt, now)));

    if (due.length === 0) return;

    for (const post of due) {
      const publishedUrls: Record<string, string> = {};
      const platforms: string[] = (post.platformTargets as string[]) ?? [];

      // Per-platform publish. Real API calls are gated on env vars.
      for (const platform of platforms) {
        try {
          const url = await publishToplatform(platform, post.content);
          if (url) publishedUrls[platform] = url;
        } catch (err) {
          logger.warn({ err, postId: post.id, platform }, "Failed to publish social post to platform");
        }
      }

      await db.update(socialPosts).set({
        status: "published",
        publishedAt: now,
        publishedUrls,
        updatedAt: now,
      } as never).where(eq(socialPosts.id, post.id));

      logger.info({ postId: post.id, platforms, publishedUrls }, "Scheduled social post published");
    }
  } catch (err) {
    logger.error({ err }, "Error in scheduled social post processor");
  }
}

// Attempts a real platform API call if the relevant token env var is set.
// Returns the live post URL on success, null if credentials are missing.
async function publishToplatform(platform: string, content: string): Promise<string | null> {
  if (platform === "facebook") {
    const token = process.env.SOCIAL_FACEBOOK_TOKEN;
    const pageId = process.env.SOCIAL_FACEBOOK_PAGE_ID;
    if (!token || !pageId) return null;
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: content, access_token: token }),
    });
    const json = (await res.json()) as { id?: string; error?: unknown };
    return json.id ? `https://www.facebook.com/${json.id}` : null;
  }
  if (platform === "instagram") {
    // Instagram requires a two-step: create container → publish.
    const token = process.env.SOCIAL_INSTAGRAM_TOKEN;
    const igUserId = process.env.SOCIAL_INSTAGRAM_USER_ID;
    if (!token || !igUserId) return null;
    const container = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption: content, access_token: token }),
    });
    const c = (await container.json()) as { id?: string };
    if (!c.id) return null;
    const pub = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: c.id, access_token: token }),
    });
    const p = (await pub.json()) as { id?: string };
    return p.id ? `https://www.instagram.com/p/${p.id}/` : null;
  }
  if (platform === "twitter") {
    const token = process.env.SOCIAL_TWITTER_TOKEN;
    if (!token) return null;
    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text: content }),
    });
    const json = (await res.json()) as { data?: { id?: string } };
    return json.data?.id ? `https://twitter.com/i/web/status/${json.data.id}` : null;
  }
  if (platform === "linkedin") {
    const token = process.env.SOCIAL_LINKEDIN_TOKEN;
    const urn = process.env.SOCIAL_LINKEDIN_URN; // e.g. "urn:li:person:xxx" or "urn:li:organization:xxx"
    if (!token || !urn) return null;
    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "X-Restli-Protocol-Version": "2.0.0" },
      body: JSON.stringify({
        author: urn, lifecycleState: "PUBLISHED",
        specificContent: { "com.linkedin.ugc.ShareContent": { shareCommentary: { text: content }, shareMediaCategory: "NONE" } },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });
    const json = (await res.json()) as { id?: string };
    return json.id ? `https://www.linkedin.com/feed/update/${json.id}` : null;
  }
  return null;
}

export function startSocialPostScheduler(): void {
  const RUN_INTERVAL_MS = 60 * 1000; // every minute
  setInterval(() => {
    publishScheduledPosts().catch((err) => logger.error({ err }, "Scheduled social post run failed"));
  }, RUN_INTERVAL_MS);
  logger.info("Social post scheduler started (every 60s)");
}
