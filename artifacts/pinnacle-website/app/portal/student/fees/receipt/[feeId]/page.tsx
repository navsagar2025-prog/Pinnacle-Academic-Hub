import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { feeRecords, students, users, batches, courses } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CheckCircle, Printer } from "lucide-react";
import Link from "next/link";
import PrintButton from "./PrintButton";

export const metadata = { title: "Payment Receipt — Pinnacle Academic Classes" };

export default async function ReceiptPage({ params }: { params: Promise<{ feeId: string }> }) {
  const { feeId } = await params;
  const dbUser = await requirePortalRole("student");

  const [enrollment] = await db
    .select({ studentId: students.id, batchId: students.batchId, rollNumber: students.rollNumber, guardianName: students.guardianName })
    .from(students)
    .where(and(eq(students.userId, dbUser.id), eq(students.isActive, true)))
    .limit(1);

  if (!enrollment) notFound();

  const [fee] = await db
    .select()
    .from(feeRecords)
    .where(and(eq(feeRecords.id, feeId), eq(feeRecords.studentId, enrollment.studentId)))
    .limit(1);

  if (!fee || fee.status !== "paid") notFound();

  const batchInfo = enrollment.batchId
    ? await db
        .select({ batchName: batches.name, courseName: courses.title })
        .from(batches)
        .leftJoin(courses, eq(batches.courseId, courses.id))
        .where(eq(batches.id, enrollment.batchId))
        .limit(1)
        .then((r) => r[0] ?? null)
    : null;

  const receiptNo = `PAC-${fee.id.slice(0, 8).toUpperCase()}`;
  const paidOn = fee.paidDate
    ? new Date(fee.paidDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const paymentMethod = fee.razorpayPaymentId ? "Online (Razorpay)" : fee.transactionRef ? "NEFT / Manual" : "Cash";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between no-print">
        <Link href="/pinnacle-website/portal/student/fees" className="text-sm text-[var(--color-teal)] hover:underline">
          ← Back to Fee Status
        </Link>
        <PrintButton />
      </div>

      <div className="card border-2 border-[var(--color-navy)]/10 print:border-slate-300 print:shadow-none" id="receipt">
        <div className="flex items-start justify-between border-b border-slate-100 pb-5 mb-5">
          <div>
            <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
              Pinnacle Academic Classes
            </h1>
            <p className="text-slate-500 text-xs mt-1">KCK Corporate Services Pvt. Ltd. · Greater Noida</p>
            <p className="text-slate-400 text-xs">accounts@pinnacleacademic.in · +91 9999 000 111</p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 bg-[var(--color-teal)]/10 text-[var(--color-teal)] px-3 py-1 rounded-full text-xs font-semibold">
              <CheckCircle size={13} />
              PAID
            </div>
            <div className="text-xs text-slate-400 mt-2">Receipt No.</div>
            <div className="font-mono font-bold text-sm text-[var(--color-navy)]">{receiptNo}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wide mb-2 font-semibold">Student Details</div>
            <div className="space-y-1 text-sm">
              <div className="font-semibold text-[var(--color-navy)]">{dbUser.name}</div>
              <div className="text-slate-500">Roll No: {enrollment.rollNumber}</div>
              {batchInfo && <div className="text-slate-500">{batchInfo.courseName} · {batchInfo.batchName}</div>}
              {enrollment.guardianName && <div className="text-slate-500">Guardian: {enrollment.guardianName}</div>}
              {dbUser.phone && <div className="text-slate-500">{dbUser.phone}</div>}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wide mb-2 font-semibold">Payment Details</div>
            <div className="space-y-1 text-sm">
              <div className="text-slate-500">Period: <span className="text-[var(--color-navy)] font-medium">{fee.period}</span></div>
              <div className="text-slate-500">Date: <span className="text-[var(--color-navy)] font-medium">{paidOn}</span></div>
              <div className="text-slate-500">Method: <span className="text-[var(--color-navy)] font-medium">{paymentMethod}</span></div>
              {fee.razorpayPaymentId && (
                <div className="text-slate-500">Payment ID: <span className="font-mono text-xs text-[var(--color-navy)]">{fee.razorpayPaymentId}</span></div>
              )}
              {fee.razorpayOrderId && (
                <div className="text-slate-500">Order ID: <span className="font-mono text-xs text-[var(--color-navy)]">{fee.razorpayOrderId}</span></div>
              )}
              {fee.transactionRef && !fee.razorpayPaymentId && (
                <div className="text-slate-500">Ref: <span className="font-mono text-xs text-[var(--color-navy)]">{fee.transactionRef}</span></div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-navy)]/3 rounded-lg p-4 flex items-center justify-between border border-[var(--color-navy)]/10">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Amount Paid</div>
            <div className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[var(--color-navy)] mt-0.5">
              ₹{fee.paidAmount.toLocaleString("en-IN")}
            </div>
            {fee.paidAmount !== fee.amount && (
              <div className="text-xs text-slate-400 mt-1">of ₹{fee.amount.toLocaleString("en-IN")} total fee</div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Status</div>
            <div className="text-sm font-bold text-[var(--color-teal)] uppercase">Settled</div>
          </div>
        </div>

        {fee.notes && (
          <div className="mt-4 text-xs text-slate-500 border-t border-slate-100 pt-4">
            Notes: {fee.notes}
          </div>
        )}

        <div className="mt-6 border-t border-dashed border-slate-200 pt-4 text-center">
          <p className="text-xs text-slate-400">
            This is a computer-generated receipt and does not require a physical signature.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Pinnacle Academic Classes · Greater Noida · www.pinnacleacademic.in
          </p>
        </div>
      </div>
    </div>
  );
}
