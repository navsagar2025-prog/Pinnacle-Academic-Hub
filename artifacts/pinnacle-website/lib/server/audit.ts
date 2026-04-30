import { db } from "@workspace/db";
import { auditLogs } from "@workspace/db/schema";

export async function logAudit(
  actorId: string | null,
  actorName: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, unknown>,
) {
  try {
    await db.insert(auditLogs).values({
      actorId: actorId ?? undefined,
      actorName,
      action,
      entityType,
      entityId,
      details,
    });
  } catch {
  }
}
