import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { feeRecords, students } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";
import { verifyPaymentSignature } from "@/lib/server/razorpay";
import { logAudit } from "@/lib/server/audit";
import { sendPaymentConfirmation } from "@/lib/server/email";

export async function POST(request: Request) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "student") return err("Forbidden", 403);

  const body = await request.json().catch(() => null);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, feeId } = body ?? {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !feeId) {
    return err("Missing required payment fields", 400);
  }

  const isValid = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid) return err("Payment signature verification failed", 400);

  const [enrollment] = await db
    .select({ studentId: students.id })
    .from(students)
    .where(and(eq(students.userId, actor.id), eq(students.isActive, true)))
    .limit(1);

  if (!enrollment) return err("Student record not found", 404);

  const [fee] = await db
    .select()
    .from(feeRecords)
    .where(and(eq(feeRecords.id, feeId), eq(feeRecords.studentId, enrollment.studentId)))
    .limit(1);

  if (!fee) return err("Fee record not found", 404);
  if (fee.razorpayOrderId !== razorpay_order_id) {
    return err("Order ID mismatch", 400);
  }

  const now = new Date();
  const [updated] = await db
    .update(feeRecords)
    .set({
      paidAmount: fee.amount,
      status: "paid",
      paidDate: now,
      razorpayPaymentId: razorpay_payment_id,
      transactionRef: razorpay_payment_id,
      updatedAt: now,
    })
    .where(eq(feeRecords.id, feeId))
    .returning();

  await logAudit(
    actor.id,
    actor.name,
    "fee.payment",
    "fee_record",
    feeId,
    { orderId: razorpay_order_id, paymentId: razorpay_payment_id, amount: fee.amount },
  );

  if (actor.email) {
    void sendPaymentConfirmation({
      to: actor.email,
      name: actor.name,
      period: fee.period,
      amount: fee.amount,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      paidDate: updated.paidDate ?? now,
      receiptPath: `/portal/student/fees/receipt/${feeId}`,
    });
  }

  return ok({ feeId, status: "paid", paidDate: updated.paidDate, paymentId: razorpay_payment_id });
}
