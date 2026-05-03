import { db } from "@workspace/db";
import { mockTests, mockTestQuestions, batches, courses } from "@workspace/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { Sparkles, FileQuestion, Users } from "lucide-react";
import Link from "next/link";
import { CreateTestButton } from "./CreateTestModal";

export const metadata = { title: "Mock Tests — Admin Panel" };

export default async function AdminMockTestsPage() {
  const tests = await db
    .select({
      id: mockTests.id,
      title: mockTests.title,
      subject: mockTests.subject,
      examType: mockTests.examType,
      durationMinutes: mockTests.durationMinutes,
      marksPerQuestion: mockTests.marksPerQuestion,
      isPublished: mockTests.isPublished,
      isPublic: mockTests.isPublic,
      batchName: batches.name,
      questionCount: sql<number>`(select count(*)::int from ${mockTestQuestions} where ${mockTestQuestions.testId} = ${mockTests.id})`,
      createdAt: mockTests.createdAt,
    })
    .from(mockTests)
    .leftJoin(batches, eq(mockTests.batchId, batches.id))
    .orderBy(desc(mockTests.createdAt));

  const allBatches = await db
    .select({ id: batches.id, name: batches.name, courseTitle: courses.title })
    .from(batches)
    .leftJoin(courses, eq(batches.courseId, courses.id))
    .orderBy(batches.name);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Mock Tests</h1>
          <p className="text-slate-500 text-sm mt-1">Interactive online MCQ tests with auto-scoring and topic-wise analysis</p>
        </div>
        <CreateTestButton batches={allBatches} />
      </div>

      {tests.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
          <p>No mock tests yet. Click &quot;Create Test&quot; to start.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((t) => (
            <Link
              key={t.id}
              href={`/portal/admin/mock-tests/${t.id}`}
              className="card hover:shadow-elevated transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)] group-hover:text-[var(--color-teal)] transition-colors line-clamp-2">{t.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{t.subject} · {t.examType}</p>
                </div>
                <span className={`badge text-[10px] uppercase ${t.isPublished ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)]" : "bg-slate-100 text-slate-500"}`}>
                  {t.isPublished ? "Live" : "Draft"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs">
                <div className="text-center">
                  <div className="font-bold text-[var(--color-navy)] flex items-center justify-center gap-1">
                    <FileQuestion size={12} />{t.questionCount ?? 0}
                  </div>
                  <div className="text-slate-400 mt-0.5">Questions</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-[var(--color-navy)]">{t.durationMinutes}m</div>
                  <div className="text-slate-400 mt-0.5">Duration</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-[var(--color-navy)] flex items-center justify-center gap-1">
                    <Users size={12} />{t.batchName ?? (t.isPublic ? "Public" : "—")}
                  </div>
                  <div className="text-slate-400 mt-0.5">Audience</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
