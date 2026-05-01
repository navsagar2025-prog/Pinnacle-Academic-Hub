import { db } from "@workspace/db";
import { feeRecords } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/server/razorpay";
import { logAudit } from "@/lib/server/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { event: string; payload?: { payment?: { entity?: Record<string, unknown> } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event === "payment.captured") {
    const payment = event.payload?.payment?.entity ?? {};
    const orderId = payment.order_id as string | undefined;
    const paymentId = payment.id as string | undefined;
    const capturedAmount = typeof payment.amount === "number" ? Math.floor(payment.amount / 100) : 0;

    if (orderId && paymentId) {
      const [fee] = await db
        .select()
        .from(feeRecords)
        .where(eq(feeRecords.razorpayOrderId, orderId))
        .limit(1);

      if (fee && fee.status !== "paid") {
        const now = new Date();
        await db
          .update(feeRecords)
          .set({
            paidAmount: capturedAmount,
            status: "paid",
            paidDate: now,
            razorpayPaymentId: paymentId,
            transactionRef: paymentId,
            updatedAt: now,
          })
          .where(eq(feeRecords.id, fee.id));

        await logAudit(
          null,
          "Razorpay Webhook",
          "fee.payment",
          "fee_record",
          fee.id,
          { orderId, paymentId, amount: capturedAmount, via: "webhook" },
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
