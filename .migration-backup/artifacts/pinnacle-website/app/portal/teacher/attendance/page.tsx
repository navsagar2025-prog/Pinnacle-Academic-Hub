import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { teachers, schedules, batches, students, users, courses } from "@workspace/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { AlertCircle } from "lucide-react";
import AttendanceClient from "./AttendanceClient";

export const metadata = { title: "Mark Attendance — Teacher Portal" };

export default async function TeacherAttendancePage() {
  const dbUser = await requirePortalRole("teacher");

  const [teacher] = await db
    .select({ id: teachers.id, designation: teachers.designation })
    .from(teachers)
    .where(and(eq(teachers.userId, dbUser.id), eq(teachers.isActive, true)))
    .limit(1);

  const assignedBatches = teacher
    ? await db
        .selectDistinct({
          batchId: batches.id,
          batchName: batches.name,
          timingLabel: batches.timingLabel,
          courseTitle: courses.title,
          subjects: sql<string[]>`array_agg(DISTINCT ${schedules.subject})`,
        })
        .from(schedules)
        .leftJoin(batches, eq(schedules.batchId, batches.id))
        .leftJoin(courses, eq(batches.courseId, courses.id))
        .where(eq(schedules.teacherId, teacher.id))
        .groupBy(batches.id, batches.name, batches.timingLabel, courses.title)
    : [];

  const validBatches = assignedBatches.filter((b): b is typeof b & { batchId: string } => b.batchId !== null);

  const studentsByBatch: Record<string, { id: string; name: string; rollNumber: string }[]> = {};
  for (const b of validBatches) {
    const rows = await db
      .select({
        id: students.id,
        name: users.name,
        rollNumber: students.rollNumber,
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .where(and(eq(students.batchId, b.batchId), eq(students.isActive, true)))
      .orderBy(asc(students.rollNumber));

    studentsByBatch[b.batchId] = rows.map((r) => ({
      id: r.id,
      name: r.name ?? "Unknown",
      rollNumber: r.rollNumber,
    }));
  }

  const batches2 = validBatches.map((b) => ({
    id: b.batchId,
    name: b.batchName ?? "",
    timingLabel: b.timingLabel,
    courseTitle: b.courseTitle,
    subjects: b.subjects ?? [],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
          Mark Attendance
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Select a batch and date, then mark each student present or absent
        </p>
      </div>

      {!teacher && (
        <div className="card bg-amber-50 border border-amber-100 flex items-start gap-3">
          <AlertCircle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">
            Your teacher profile is not set up. Contact admin to complete your onboarding.
          </p>
        </div>
      )}

      {teacher && assignedBatches.length === 0 && (
        <div className="card text-center py-12">
          <AlertCircle size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No batches assigned yet. Contact admin to assign you to a batch.</p>
        </div>
      )}

      {teacher && assignedBatches.length > 0 && (
        <AttendanceClient batches={batches2} studentsByBatch={studentsByBatch} />
      )}
    </div>
  );
}
