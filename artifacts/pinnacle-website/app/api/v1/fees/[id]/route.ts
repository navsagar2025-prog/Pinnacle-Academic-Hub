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
    const { paymentAmount, transactionRef, paymentMethod, notes, waive } = body;

    const [existing] = await db.select().from(feeRecords).where(eq(feeRecords.id, id)).limit(1);
    if (!existing) return err("Fee record not found", 404);

    if (waive) {
      const [row] = await db.update(feeRecords).set({
        status: "waived",
        ...(notes !== undefined && { notes }),
        updatedAt: new Date(),
      }).where(eq(feeRecords.id, id)).returning();
      await logAudit(actor.id, actor.name, "fee.waive", "feeRecord", id, {});
      return ok(row);
    }

    if (paymentAmount !== undefined) {
      const amount = Number(paymentAmount);
      if (isNaN(amount) || amount <= 0) return err("paymentAmount must be a positive number", 400);

      const newPaidAmount = Math.min((existing.paidAmount ?? 0) + amount, existing.amount);
      const isPaid = newPaidAmount >= existing.amount;
      const newStatus = isPaid ? "paid" : newPaidAmount > 0 ? "partial" : existing.status;

      const [row] = await db.update(feeRecords).set({
        paidAmount: newPaidAmount,
        status: newStatus,
        ...(isPaid && { paidDate: new Date() }),
        ...(paymentMethod !== undefined && { paymentMethod }),
        ...(transactionRef !== undefined && { transactionRef }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date(),
      }).where(eq(feeRecords.id, id)).returning();

      await logAudit(actor.id, actor.name, "fee.payment", "feeRecord", id, {
        amount, newPaidAmount, totalAmount: existing.amount, status: newStatus, transactionRef,
      });
      return ok(row);
    }

    if (notes !== undefined || transactionRef !== undefined) {
      const [row] = await db.update(feeRecords).set({
        ...(notes !== undefined && { notes }),
        ...(transactionRef !== undefined && { transactionRef }),
        updatedAt: new Date(),
      }).where(eq(feeRecords.id, id)).returning();
      return ok(row);
    }

    return err("No valid update fields provided", 400);
  } catch (e) {
    console.error("PATCH /api/v1/fees/[id] error:", e);
    return err("Failed to update fee record");
  }
}
