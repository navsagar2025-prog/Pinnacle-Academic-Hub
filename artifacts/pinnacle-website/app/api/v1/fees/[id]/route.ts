import { db } from "@workspace/db";
import { feeRecords } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";
import { getDbUser } from "@/lib/server/portal-auth";
import { logAudit } from "@/lib/server/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden", 403);

  const { id } = await params;
  try {
    const body = await request.json();
    const { status, transactionRef, notes, paidDate } = body;

    const [row] = await db.update(feeRecords).set({
      ...(status && { status }),
      ...(transactionRef !== undefined && { transactionRef }),
      ...(notes !== undefined && { notes }),
      paidDate: status === "paid" ? (paidDate ? new Date(paidDate) : new Date()) : undefined,
      updatedAt: new Date(),
    }).where(eq(feeRecords.id, id)).returning();

    if (!row) return err("Fee record not found", 404);
    await logAudit(actor.id, actor.name, "fee.update", "feeRecord", id, { status, transactionRef });
    return ok(row);
  } catch (e) {
    console.error("PATCH /api/v1/fees/[id] error:", e);
    return err("Failed to update fee record");
  }
}
