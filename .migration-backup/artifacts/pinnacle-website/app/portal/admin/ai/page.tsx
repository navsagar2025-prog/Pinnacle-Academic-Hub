import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import {
  enquiries,
  batches,
  courses,
  students,
  studyMaterials,
  feeRecords,
  notices,
  users,
} from "@workspace/db/schema";
import { eq, inArray, sql, desc, and } from "drizzle-orm";
import AIAssistant from "@/components/ai/AIAssistant";
import type {
  EnquiryOption,
  BatchOption,
  OverdueStudentOption,
  RecentNotice,
} from "@/components/ai/AIAssistant";

export const metadata = { title: "AI Assistant — Admin" };

export default async function AdminAIPage() {
  await requirePortalRole("admin");

  const [enquiryRows, noticeRows, batchRows] = await Promise.all([
    db
      .select({
        id: enquiries.id,
        name: enquiries.name,
        phone: enquiries.phone,
        email: enquiries.email,
        courseInterest: enquiries.courseInterest,
        message: enquiries.message,
      })
      .from(enquiries)
      .where(eq(enquiries.isFollowedUp, false))
      .orderBy(desc(enquiries.createdAt))
      .limit(25),

    db
      .select({ title: notices.title, body: notices.body })
      .from(notices)
      .where(eq(notices.isPublic, true))
      .orderBy(desc(notices.publishedAt))
      .limit(3),

    db
      .select({
        id: batches.id,
        name: batches.name,
        courseTitle: courses.title,
        maxStudents: batches.maxStudents,
        status: batches.status,
      })
      .from(batches)
      .leftJoin(courses, eq(batches.courseId, courses.id))
      .limit(30),
  ]);

  const batchIds = batchRows.map((b) => b.id);

  const [studentCounts, materialCounts, feeStats, overdueRows] =
    batchIds.length > 0
      ? await Promise.all([
          db
            .select({
              batchId: students.batchId,
              count: sql<number>`count(*)::int`,
            })
            .from(students)
            .where(and(inArray(students.batchId, batchIds), eq(students.isActive, true)))
            .groupBy(students.batchId),

          db
            .select({
              batchId: studyMaterials.batchId,
              count: sql<number>`count(*)::int`,
            })
            .from(studyMaterials)
            .where(inArray(studyMaterials.batchId, batchIds))
            .groupBy(studyMaterials.batchId),

          db
            .select({
              studentId: students.batchId,
              total: sql<number>`count(*)::int`,
              paid: sql<number>`count(*) filter (where ${feeRecords.status} = 'paid')::int`,
            })
            .from(feeRecords)
            .innerJoin(students, eq(feeRecords.studentId, students.id))
            .where(inArray(students.batchId, batchIds))
            .groupBy(students.batchId),

          db
            .select({
              feeRecordId: feeRecords.id,
              studentId: students.id,
              rollNumber: students.rollNumber,
              guardianName: students.guardianName,
              guardianPhone: students.guardianPhone,
              studentName: users.name,
              period: feeRecords.period,
              amount: feeRecords.amount,
              dueDate: feeRecords.dueDate,
            })
            .from(feeRecords)
            .innerJoin(students, eq(feeRecords.studentId, students.id))
            .innerJoin(users, eq(students.userId, users.id))
            .where(
              and(
                inArray(feeRecords.status, ["overdue", "due"]),
                eq(students.isActive, true)
              )
            )
            .orderBy(feeRecords.dueDate)
            .limit(30),
        ])
      : [[], [], [], []];

  const studentCountMap = new Map(
    (studentCounts as { batchId: string | null; count: number }[]).map((r) => [r.batchId, r.count])
  );
  const materialCountMap = new Map(
    (materialCounts as { batchId: string | null; count: number }[]).map((r) => [r.batchId, r.count])
  );
  const feeStatMap = new Map(
    (feeStats as { studentId: string | null; total: number; paid: number }[]).map((r) => [
      r.studentId,
      { total: r.total, paid: r.paid },
    ])
  );

  const enquiryOptions: EnquiryOption[] = enquiryRows.map((e) => ({
    id: e.id,
    name: e.name,
    phone: e.phone,
    email: e.email,
    courseInterest: e.courseInterest,
    message: e.message,
  }));

  const batchOptions: BatchOption[] = batchRows.map((b) => ({
    id: b.id,
    name: b.name,
    courseTitle: b.courseTitle ?? "General",
    studentCount: studentCountMap.get(b.id) ?? 0,
    maxStudents: b.maxStudents ?? 30,
    materialCount: materialCountMap.get(b.id) ?? 0,
    totalFeeRecords: feeStatMap.get(b.id)?.total ?? 0,
    paidFeeRecords: feeStatMap.get(b.id)?.paid ?? 0,
  }));

  const overdueOptions: OverdueStudentOption[] = (
    overdueRows as {
      feeRecordId: string;
      studentId: string;
      rollNumber: string;
      guardianName: string | null;
      guardianPhone: string | null;
      studentName: string;
      period: string;
      amount: number;
      dueDate: Date;
    }[]
  ).map((r) => ({
    feeRecordId: r.feeRecordId,
    studentId: r.studentId,
    studentName: r.studentName,
    rollNumber: r.rollNumber,
    guardianName: r.guardianName,
    guardianPhone: r.guardianPhone,
    period: r.period,
    amount: r.amount,
    dueDate: r.dueDate.toISOString(),
  }));

  const recentNotices: RecentNotice[] = noticeRows.map((n) => ({
    title: n.title,
    body: n.body,
  }));

  return (
    <AIAssistant
      enquiries={enquiryOptions}
      batches={batchOptions}
      overdueStudents={overdueOptions}
      recentNotices={recentNotices}
    />
  );
}
