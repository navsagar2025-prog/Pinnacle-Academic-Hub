import { sql } from "drizzle-orm";
import { questionBank, auditLogs } from "@workspace/db/schema";
import { db } from "@/lib/db";

export const PURGE_AFTER_DAYS = 7;

export const notDeleted = sql`${questionBank.deletedAt} is null`;

export const isDeleted = sql`${questionBank.deletedAt} is not null`;

export const hasPendingDeletionRequest = sql`${questionBank.deletionRequestedAt} is not null and ${questionBank.deletedAt} is null`;

export type QbAuditAction =
  | "qb.delete.requested"
  | "qb.delete.request_cleared"
  | "qb.delete.approved"
  | "qb.delete.bulk_approved"
  | "qb.delete.restored"
  | "qb.delete.purged"
  | "qb.delete.cron_run";

/** Stable identifier used in audit_logs for the daily purge cron heartbeat. */
export const PURGE_CRON_AUDIT_ENTITY_ID = "purge-deleted-questions";

export async function logQbAudit(opts: {
  actorId: string | null;
  actorName: string | null;
  action: QbAuditAction;
  entityId: string;
  details?: Record<string, unknown>;
}) {
  await db.insert(auditLogs).values({
    actorId: opts.actorId,
    actorName: opts.actorName,
    action: opts.action,
    entityType: "question_bank",
    entityId: opts.entityId,
    details: opts.details ?? null,
  });
}

export async function logQbAuditBulk(opts: {
  actorId: string | null;
  actorName: string | null;
  action: QbAuditAction;
  ids: string[];
  details?: Record<string, unknown>;
}) {
  if (opts.ids.length === 0) return;
  await db.insert(auditLogs).values(
    opts.ids.map((id) => ({
      actorId: opts.actorId,
      actorName: opts.actorName,
      action: opts.action,
      entityType: "question_bank" as const,
      entityId: id,
      details: opts.details ?? null,
    })),
  );
}
