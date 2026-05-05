import { db } from "@workspace/db";
import { mockTests, mockTestQuestions, mockTestAttempts, batches, courses } from "@workspace/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { Sparkles, FileQuestion, Users, Clock, CalendarClock } from "lucide-react";
import Link from "next/link";
import { requirePortalRole, getTeacherPermissions } from "@/lib/server/portal-auth";
import { TeacherCreateTestButton } from "./CreateTestModal";

export const metadata = { title: "Mock Tests — Teacher Portal" };

export default async function TeacherMockTestsPage() {
  const user = await requirePortalRole("teacher");
  const perms = await getTeacherPermissions(user.id);

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
      scheduledStart: mockTests.scheduledStart,
      scheduledEnd: mockTests.scheduledEnd,
      batchName: batches.name,
      questionCount: sql<number>`(select count(*)::int from ${mockTestQuestions} where ${mockTestQuestions.testId} = ${mockTests.id})`,
      attemptCount: sql<number>`(select count(*)::int from ${mockTestAttempts} where ${mockTestAttempts.testId} = ${mockTests.id})`,
      createdAt: mockTests.createdAt,
    })
    .from(mockTests)
    .leftJoin(batches, eq(mockTests.batchId, batches.id))
    .where(eq(mockTests.createdBy, user.id))
    .orderBy(desc(mockTests.createdAt));

  const allBatches = await db
    .select({ id: batches.id, name: batches.name, courseTitle: courses.title })
    .from(batches)
    .leftJoin(courses, eq(batches.courseId, courses.id))
    .orderBy(batches.name);

  const allowedSubjects = perms?.allowedSubjects ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">My Mock Tests</h1>
          <p className="text-slate-500 text-sm mt-1">
            Create and manage MCQ tests for your students
            {perms?.isExaminer && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-gold)]/10 text-[var(--color-gold)] text-[10px] font-bold uppercase">
                <Sparkles size={10} /> Examiner — All Subjects
              </span>
            )}
          </p>
        </div>
        <TeacherCreateTestButton batches={allBatches} allowedSubjects={allowedSubjects} />
      </div>

      {tests.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
          <p>No mock tests yet. Click &quot;Create Test&quot; to get started.</p>
          <p className="text-xs mt-2">
            {perms?.isExaminer
              ? "As an examiner, you can create tests for any subject."
              : `You can create tests for: ${allowedSubjects.join(", ") || "No subjects assigned"}`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((t) => {
            const now = Date.now();
            const startMs = t.scheduledStart ? new Date(t.scheduledStart).getTime() : null;
            const endMs = t.scheduledEnd ? new Date(t.scheduledEnd).getTime() : null;
            const isScheduledFuture = t.isPublished && startMs !== null && now < startMs;
            const isScheduledOpen = t.isPublished && startMs !== null && endMs !== null && now >= startMs && now <= endMs;
            const isScheduledClosed = t.isPublished && endMs !== null && now > endMs;
            return (
            <Link
              key={t.id}
              href={`/portal/teacher/mock-tests/${t.id}`}
              className="card hover:shadow-elevated transition-all group"
            >
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)] group-hover:text-[var(--color-teal)] transition-colors line-clamp-2">{t.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{t.subject} · {t.examType}</p>
                </div>
                {!t.isPublished ? (
                  <span className="badge text-[10px] uppercase bg-slate-100 text-slate-500">Draft</span>
                ) : isScheduledFuture ? (
                  <span className="badge text-[10px] uppercase bg-[var(--color-gold)]/10 text-[var(--color-gold)] flex items-center gap-1">
                    <CalendarClock size={10} />Scheduled
                  </span>
                ) : isScheduledClosed ? (
                  <span className="badge text-[10px] uppercase bg-slate-100 text-slate-500">Closed</span>
                ) : (
                  <span className="badge text-[10px] uppercase bg-[var(--color-teal)]/10 text-[var(--color-teal)]">
                    {isScheduledOpen ? "Open Now" : "Live"}
                  </span>
                )}
              </div>
              {t.scheduledStart && t.scheduledEnd && (
                <p className="text-[11px] text-slate-500 mb-2 flex items-center gap-1">
                  <CalendarClock size={11} className="text-[var(--color-teal)]" />
                  {new Date(t.scheduledStart).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} → {new Date(t.scheduledEnd).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                </p>
              )}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs">
                <div className="text-center">
                  <div className="font-bold text-[var(--color-navy)] flex items-center justify-center gap-1">
                    <FileQuestion size={12} />{t.questionCount ?? 0}
                  </div>
                  <div className="text-slate-400 mt-0.5">Questions</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-[var(--color-navy)] flex items-center justify-center gap-1">
                    <Clock size={12} />{t.durationMinutes}m
                  </div>
                  <div className="text-slate-400 mt-0.5">Duration</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-[var(--color-navy)] flex items-center justify-center gap-1">
                    <Users size={12} />{t.attemptCount ?? 0}
                  </div>
                  <div className="text-slate-400 mt-0.5">Attempts</div>
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
