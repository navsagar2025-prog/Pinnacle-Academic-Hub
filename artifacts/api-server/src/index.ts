import app from "./app";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./lib/logger";
import { startFeeReminderScheduler, startSocialPostScheduler } from "./lib/scheduler.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Ensure the unique partial index that guards reminder deduplication exists.
// Using IF NOT EXISTS makes this idempotent across all deployments/restarts.
async function applyStartupMigrations(): Promise<void> {
  // One row per (fee_record_id, reminder_date) — prevents duplicate reminders.
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS audit_logs_reminder_dedup_idx
      ON audit_logs (action, entity_type, entity_id, (details->>'date'))
      WHERE action       = 'fee_reminder_sent'
        AND entity_type  = 'fee_record'
        AND details->>'date' IS NOT NULL
  `);
  // One row per fee_record_id — prevents duplicate confirmation receipts.
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS audit_logs_confirmation_dedup_idx
      ON audit_logs (action, entity_type, entity_id)
      WHERE action      = 'fee_confirmation_sent'
        AND entity_type = 'fee_record'
  `);

  // Social media tables — idempotent creation for fresh deployments
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS social_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      platform TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_id TEXT,
      access_token TEXT,
      refresh_token TEXT,
      token_expires_at TIMESTAMPTZ,
      page_id TEXT,
      status TEXT NOT NULL DEFAULT 'connected',
      connected_by TEXT,
      connected_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS social_accounts_platform_uq ON social_accounts (platform)
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS social_posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      content TEXT NOT NULL,
      media_urls JSONB DEFAULT '[]',
      platform_targets JSONB NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'pending',
      scheduled_at TIMESTAMPTZ,
      published_at TIMESTAMPTZ,
      posted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      posted_by_name TEXT,
      approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      rejection_note TEXT,
      linked_blog_id UUID,
      linked_notice_id UUID,
      published_urls JSONB DEFAULT '{}',
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS social_posts_status_idx ON social_posts (status)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS social_posts_scheduled_at_idx ON social_posts (scheduled_at)
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS social_teacher_access (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      platforms_allowed JSONB NOT NULL DEFAULT '[]',
      is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      granted_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS social_teacher_access_user_uq ON social_teacher_access (user_id)
  `);
  // Additive column: teacher acknowledgement timestamp for rejection read-state
  await db.execute(sql`
    ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS teacher_seen_at TIMESTAMPTZ
  `);

  logger.info("Startup migrations applied");
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  applyStartupMigrations()
    .then(() => {
      startFeeReminderScheduler();
      startSocialPostScheduler();
    })
    .catch((migErr) => {
      logger.error({ err: migErr }, "Startup migration failed");
      startFeeReminderScheduler();
      startSocialPostScheduler();
    });
});
