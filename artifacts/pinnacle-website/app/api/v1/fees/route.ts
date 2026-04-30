import { db } from "@workspace/db";
import { feeRecords, students, users } from "@workspace/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { paginatedOk, err } from "@/lib/server/api-response";
import { getDbUser } from "@/lib/server/portal-auth";

export async function GET(request: Request) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden", 403);

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30"), 100);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;
  const statusFilter = searchParams.get("status");

  try {
    const rows = await db
      .select({
        id: feeRecords.id,
        period: feeRecords.period,
        amount: feeRecords.amount,
        dueDate: feeRecords.dueDate,
        paidDate: feeRecords.paidDate,
        status: feeRecords.status,
        transactionRef: feeRecords.transactionRef,
        notes: feeRecords.notes,
        createdAt: feeRecords.createdAt,
        studentId: feeRecords.studentId,
        rollNumber: students.rollNumber,
        studentName: users.name,
        studentPhone: users.phone,
      })
      .from(feeRecords)
      .leftJoin(students, eq(feeRecords.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .where(statusFilter ? eq(feeRecords.status, statusFilter as "paid" | "due" | "overdue" | "waived") : undefined)
      .orderBy(desc(feeRecords.dueDate))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(feeRecords)
      .where(statusFilter ? eq(feeRecords.status, statusFilter as "paid" | "due" | "overdue" | "waived") : undefined);

    return paginatedOk(rows, count, page, limit);
  } catch (e) {
    console.error("GET /api/v1/fees error:", e);
    return err("Failed to fetch fee records");
  }
}
