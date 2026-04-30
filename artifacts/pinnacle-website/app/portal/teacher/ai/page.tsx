import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import {
  batches,
  courses,
  students,
  studyMaterials,
  feeRecords,
  notices,
} from "@workspace/db/schema";
import { eq, inArray, sql, desc, and } from "drizzle-orm";
import AIAssistant from "@/components/ai/AIAssistant";
import type { BatchOption, RecentNotice } from "@/components/ai/AIAssistant";

export const metadata = { title: "AI Assistant — Teacher Portal" };

export default async function TeacherAIPage() {
  await requirePortalRole("teacher");

  const [noticeRows, batchRows] = await Promise.all([
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

  const [studentCounts, materialCounts, feeStats] =
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
              batchId: students.batchId,
              total: sql<number>`count(*)::int`,
              paid: sql<number>`count(*) filter (where ${feeRecords.status} = 'paid')::int`,
            })
            .from(feeRecords)
            .innerJoin(students, eq(feeRecords.studentId, students.id))
            .where(inArray(students.batchId, batchIds))
            .groupBy(students.batchId),
        ])
      : [[], [], []];

  const studentCountMap = new Map(
    (studentCounts as { batchId: string | null; count: number }[]).map((r) => [r.batchId, r.count])
  );
  const materialCountMap = new Map(
    (materialCounts as { batchId: string | null; count: number }[]).map((r) => [r.batchId, r.count])
  );
  const feeStatMap = new Map(
    (feeStats as { batchId: string | null; total: number; paid: number }[]).map((r) => [
      r.batchId,
      { total: r.total, paid: r.paid },
    ])
  );

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

  const recentNotices: RecentNotice[] = noticeRows.map((n) => ({
    title: n.title,
    body: n.body,
  }));

  return (
    <AIAssistant
      enquiries={[]}
      batches={batchOptions}
      overdueStudents={[]}
      recentNotices={recentNotices}
      userRole="teacher"
    />
  );
}
