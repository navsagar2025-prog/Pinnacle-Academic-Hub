import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { feeRecords, students } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";
import { getRazorpay } from "@/lib/server/razorpay";

export async function POST(request: Request) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "student") return err("Only students can initiate payments", 403);

  const body = await request.json().catch(() => null);
  const feeId = body?.feeId as string | undefined;
  if (!feeId) return err("feeId is required", 400);

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
  if (fee.status === "paid" || fee.status === "waived") {
    return err("This fee is already settled", 400);
  }

  const amountDue = fee.amount - fee.paidAmount;
  if (amountDue <= 0) return err("No outstanding balance", 400);

  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: amountDue * 100,
      currency: "INR",
      receipt: `fee_${feeId.slice(0, 16)}`,
      notes: {
        feeId,
        studentId: enrollment.studentId,
        period: fee.period,
      },
    });

    await db
      .update(feeRecords)
      .set({ razorpayOrderId: order.id, updatedAt: new Date() })
      .where(eq(feeRecords.id, feeId));

    return ok({
      orderId: order.id,
      amount: amountDue * 100,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      feeId,
      period: fee.period,
      studentName: actor.name,
      studentEmail: actor.email,
      studentPhone: actor.phone ?? "",
    });
  } catch (e) {
    console.error("create-order error:", e);
    return err("Failed to create payment order");
  }
}
