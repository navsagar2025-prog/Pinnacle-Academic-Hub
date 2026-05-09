import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { questionBank, batches, students, users } from "@workspace/db/schema";
import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getSetDetail } from "@/lib/server/practice-sets";
import { PracticeSetEditor } from "@/components/portal/PracticeSetEditor";

export const metadata = { title: "Practice Set — Teacher Portal" };

export default async function TeacherPracticeSetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePortalRole("teacher");
  const { id } = await params;
  const detail = await getSetDetail(id);
  if (!detail) notFound();

  const [subjectsRows, allBatches, allStudents] = await Promise.all([
    db.selectDistinct({ subject: questionBank.subject }).from(questionBank)
      .where(eq(questionBank.isPublished, true)).orderBy(asc(questionBank.subject)),
    db.select({ id: batches.id, name: batches.name }).from(batches).orderBy(asc(batches.name)),
    db.select({
      id: students.id, rollNumber: students.rollNumber, name: users.name, batchName: batches.name,
    }).from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(batches, eq(students.batchId, batches.id))
      .where(eq(students.isActive, true))
      .orderBy(asc(students.rollNumber)),
  ]);

  return (
    <div className="space-y-5 max-w-4xl">
      <Link href="/portal/teacher/practice-sets" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[var(--color-teal)]">
        <ChevronLeft size={14} /> Back to practice sets
      </Link>
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">{detail.set.name}</h1>
        <p className="text-slate-500 text-sm mt-1">Manage the questions in this set and the batches/students it's assigned to.</p>
      </div>

      <PracticeSetEditor
        setId={detail.set.id}
        initialName={detail.set.name}
        initialSubject={detail.set.subject}
        initialDescription={detail.set.description}
        initialActive={detail.set.isActive}
        questions={detail.questions.map((r) => ({
          id: r.question.id, subject: r.question.subject, topic: r.question.topic,
          difficulty: r.question.difficulty, questionType: r.question.questionType,
          questionText: r.question.questionText, year: r.question.year, examName: r.question.examName,
        }))}
        assignments={detail.assignments.map((a) => ({
          id: a.id, batchId: a.batchId, batchName: a.batchName,
          studentId: a.studentId, studentName: a.studentName, studentRoll: a.studentRoll,
          dueAt: a.dueAt ? a.dueAt.toISOString() : null,
        }))}
        subjects={subjectsRows.map((r) => r.subject)}
        batches={allBatches}
        students={allStudents.map((s) => ({ id: s.id, name: s.name ?? "Unnamed", rollNumber: s.rollNumber, batchName: s.batchName }))}
      />
    </div>
  );
}
