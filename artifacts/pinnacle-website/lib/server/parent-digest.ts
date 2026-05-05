import { db } from "@workspace/db";
import {
  parents,
  students,
  users,
  attendance,
  feeRecords,
  mockTestAttempts,
  mockTests,
  liveClasses,
  batches,
} from "@workspace/db/schema";
import { and, eq, gte, lt, desc, sql, asc } from "drizzle-orm";

export type ParentDigestData = {
  parentEmail: string;
  parentName: string;
  studentName: string;
  weekStart: Date;
  weekEnd: Date;
  attendance: { present: number; absent: number; late: number; total: number };
  mockTests: Array<{ title: string; score: number; maxScore: number; date: Date }>;
  upcomingClasses: Array<{ subject: string; topic: string | null; scheduledAt: Date }>;
  pendingFees: { count: number; totalAmount: number };
};

/**
 * Build digest data for a single parent (covering the last 7 days).
 * Returns null if the parent isn't linked to a student or has no contactable
 * email.
 */
export async function buildParentDigest(parentId: string): Promise<ParentDigestData | null> {
  const [link] = await db
    .select({
      parentName: users.name,
      parentEmail: users.email,
      studentId: parents.studentId,
    })
    .from(parents)
    .innerJoin(users, eq(parents.userId, users.id))
    .where(eq(parents.id, parentId))
    .limit(1);

  if (!link?.studentId || !link.parentEmail) return null;

  const [student] = await db
    .select({ id: students.id, batchId: students.batchId, name: users.name })
    .from(students)
    .leftJoin(users, eq(students.userId, users.id))
    .where(eq(students.id, link.studentId))
    .limit(1);

  if (!student?.name) return null;

  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const attRows = await db
    .select({ status: attendance.status, c: sql<number>`count(*)::int` })
    .from(attendance)
    .where(and(eq(attendance.studentId, student.id), gte(attendance.date, weekStart)))
    .groupBy(attendance.status);
  const att = { present: 0, absent: 0, late: 0, total: 0 };
  for (const r of attRows) {
    if (r.status === "present") att.present = r.c;
    else if (r.status === "absent") att.absent = r.c;
    else if (r.status === "late") att.late = r.c;
  }
  att.total = att.present + att.absent + att.late;

  const tests = await db
    .select({
      title: mockTests.title,
      score: mockTestAttempts.score,
      maxScore: mockTestAttempts.maxScore,
      date: mockTestAttempts.submittedAt,
    })
    .from(mockTestAttempts)
    .innerJoin(mockTests, eq(mockTestAttempts.testId, mockTests.id))
    .where(and(
      eq(mockTestAttempts.studentId, student.id),
      eq(mockTestAttempts.isCompleted, true),
      gte(mockTestAttempts.submittedAt, weekStart),
    ))
    .orderBy(desc(mockTestAttempts.submittedAt))
    .limit(10);

  const upcoming = student.batchId
    ? await db
        .select({
          subject: liveClasses.subject,
          topic: liveClasses.topic,
          scheduledAt: liveClasses.scheduledAt,
        })
        .from(liveClasses)
        .where(and(
          eq(liveClasses.batchId, student.batchId),
          gte(liveClasses.scheduledAt, now),
          lt(liveClasses.scheduledAt, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)),
        ))
        .orderBy(asc(liveClasses.scheduledAt))
        .limit(5)
    : [];

  const [feeAgg] = await db
    .select({
      count: sql<number>`count(*)::int`,
      totalAmount: sql<number>`coalesce(sum(${feeRecords.amount} - ${feeRecords.paidAmount}), 0)::int`,
    })
    .from(feeRecords)
    .where(and(eq(feeRecords.studentId, student.id), sql`status IN ('due','overdue')`));

  return {
    parentEmail: link.parentEmail,
    parentName: link.parentName,
    studentName: student.name,
    weekStart,
    weekEnd: now,
    attendance: att,
    mockTests: tests.map((t) => ({
      title: t.title,
      score: t.score ?? 0,
      maxScore: t.maxScore ?? 0,
      date: t.date ?? now,
    })),
    upcomingClasses: upcoming.map((c) => ({
      subject: c.subject ?? "—",
      topic: c.topic,
      scheduledAt: c.scheduledAt,
    })),
    pendingFees: { count: feeAgg.count, totalAmount: feeAgg.totalAmount },
  };
}

/**
 * Returns the IDs of all parents linked to active students. Used by the
 * weekly cron to know who to email.
 */
export async function listDigestRecipients(): Promise<string[]> {
  const rows = await db
    .select({ id: parents.id })
    .from(parents)
    .innerJoin(students, eq(parents.studentId, students.id))
    .innerJoin(users, eq(parents.userId, users.id))
    .where(and(eq(students.isActive, true), sql`${users.email} is not null`));
  return rows.map((r) => r.id);
}

/**
 * Filter a list of batch ids and return how many distinct active students
 * each batch has — used by admin previews. (kept here for symmetry.)
 */
export async function countActiveStudentsByBatch(): Promise<Map<string, number>> {
  const rows = await db
    .select({ batchId: students.batchId, c: sql<number>`count(*)::int` })
    .from(students)
    .innerJoin(batches, eq(students.batchId, batches.id))
    .where(eq(students.isActive, true))
    .groupBy(students.batchId);
  const m = new Map<string, number>();
  for (const r of rows) if (r.batchId) m.set(r.batchId, r.c);
  return m;
}
