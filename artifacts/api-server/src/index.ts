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
