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
    // If an impersonation is active for the current request, automatically
    // tag the log entry with the real admin so the audit trail can never
    // hide who actually performed the action.
    let mergedDetails = details;
    try {
      const { readImpersonationContext } = await import("./impersonation");
      const ctx = await readImpersonationContext();
      if (ctx) {
        mergedDetails = {
          ...(details ?? {}),
          impersonatedBy: {
            sessionId: ctx.sessionId,
            adminUserId: ctx.adminUserId,
            adminName: ctx.adminName,
          },
        };
      }
    } catch {
    }
    await db.insert(auditLogs).values({
      actorId: actorId ?? undefined,
      actorName,
      action,
      entityType,
      entityId,
      details: mergedDetails,
    });
  } catch {
  }
}
