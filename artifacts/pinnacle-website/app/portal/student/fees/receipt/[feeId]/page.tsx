/**
 * The receipt URL is now a thin server-side redirect to the watermarked
 * download proxy. The previous browser-print HTML page has been retired so
 * there is no path that bypasses pdf-lib stamping.
 */
import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { feeRecords, students } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

export const metadata = { title: "Payment Receipt — Pinnacle Academic Classes" };
export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: Promise<{ feeId: string }> }) {
  const { feeId } = await params;
  const dbUser = await requirePortalRole("student");

  // Authorise the student against their own fee record. The download proxy
  // re-checks this, but doing it here gives us a clean 404 for unauthorised
  // ids rather than a redirect-then-403 round-trip.
  const [enrollment] = await db
    .select({ studentId: students.id })
    .from(students)
    .where(and(eq(students.userId, dbUser.id), eq(students.isActive, true)))
    .limit(1);
  if (!enrollment) notFound();

  const [fee] = await db
    .select({ id: feeRecords.id, status: feeRecords.status })
    .from(feeRecords)
    .where(and(eq(feeRecords.id, feeId), eq(feeRecords.studentId, enrollment.studentId)))
    .limit(1);
  if (!fee || fee.status !== "paid") notFound();

  redirect(`/pinnacle-website/api/v1/downloads/receipt/${fee.id}`);
}
