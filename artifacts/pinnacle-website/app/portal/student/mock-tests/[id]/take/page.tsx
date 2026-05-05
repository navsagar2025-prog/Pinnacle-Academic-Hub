import { db } from "@workspace/db";
import { mockTests, mockTestQuestions, mockTestAttempts, mockTestAnswers, mockTestSections, students } from "@workspace/db/schema";
import { eq, and, asc, desc, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { TakeTestClient } from "./TakeTestClient";

export const metadata = { title: "Take Test — Student Portal" };

type Opt = "A" | "B" | "C" | "D";
const isOpt = (v: unknown): v is Opt => v === "A" || v === "B" || v === "C" || v === "D";

export default async function TakeTestPage({ params }: { params: Promise<{ id: string }> }) {
  const dbUser = await requirePortalRole("student");
  const { id } = await params;

  const [test] = await db.select().from(mockTests).where(eq(mockTests.id, id)).limit(1);
  if (!test || !test.isPublished) notFound();

  const questions = await db
    .select({
      id: mockTestQuestions.id,
      questionNumber: mockTestQuestions.questionNumber,
      questionType: mockTestQuestions.questionType,
      questionText: mockTestQuestions.questionText,
      optionA: mockTestQuestions.optionA,
      optionB: mockTestQuestions.optionB,
      optionC: mockTestQuestions.optionC,
      optionD: mockTestQuestions.optionD,
      topic: mockTestQuestions.topic,
      sectionId: mockTestQuestions.sectionId,
      imageUrl: mockTestQuestions.imageUrl,
      optionAImageUrl: mockTestQuestions.optionAImageUrl,
      optionBImageUrl: mockTestQuestions.optionBImageUrl,
      optionCImageUrl: mockTestQuestions.optionCImageUrl,
      optionDImageUrl: mockTestQuestions.optionDImageUrl,
    })
    .from(mockTestQuestions)
    .where(eq(mockTestQuestions.testId, id))
    .orderBy(asc(mockTestQuestions.questionNumber));

  const sections = await db
    .select({ id: mockTestSections.id, name: mockTestSections.name, ordering: mockTestSections.ordering })
    .from(mockTestSections)
    .where(eq(mockTestSections.testId, id))
    .orderBy(asc(mockTestSections.ordering), asc(mockTestSections.createdAt));

  if (questions.length === 0) {
    return (
      <div className="card text-center py-10">
        <p className="text-slate-500">This test has no questions yet.</p>
      </div>
    );
  }

  // Look for an in-progress attempt the student can resume.
  const [enrollment] = await db
    .select({ studentId: students.id })
    .from(students)
    .where(and(eq(students.userId, dbUser.id), eq(students.isActive, true)))
    .limit(1);

  let resume: {
    attemptId: string;
    secondsLeft: number;
    savedAnswers: Record<string, Opt>;
    savedMultiAnswers: Record<string, Opt[]>;
    savedNumAnswers: Record<string, number>;
    savedMarks: string[];
    savedTimes: Record<string, number>;
  } | null = null;

  if (enrollment?.studentId) {
    const [inProgress] = await db
      .select()
      .from(mockTestAttempts)
      .where(and(
        eq(mockTestAttempts.testId, id),
        eq(mockTestAttempts.studentId, enrollment.studentId),
        eq(mockTestAttempts.isCompleted, false),
        isNull(mockTestAttempts.submittedAt),
      ))
      .orderBy(desc(mockTestAttempts.startedAt))
      .limit(1);

    if (inProgress) {
      const elapsedSec = Math.floor((Date.now() - new Date(inProgress.startedAt).getTime()) / 1000);
      const secondsLeft = Math.max(0, test.durationMinutes * 60 - elapsedSec);
      const saved = await db
        .select({
          questionId: mockTestAnswers.questionId,
          selectedOption: mockTestAnswers.selectedOption,
          selectedOptions: mockTestAnswers.selectedOptions,
          numericalResponse: mockTestAnswers.numericalResponse,
          isMarkedForReview: mockTestAnswers.isMarkedForReview,
          timeSpentSeconds: mockTestAnswers.timeSpentSeconds,
        })
        .from(mockTestAnswers)
        .where(eq(mockTestAnswers.attemptId, inProgress.id));
      const savedAnswers: Record<string, Opt> = {};
      const savedMultiAnswers: Record<string, Opt[]> = {};
      const savedNumAnswers: Record<string, number> = {};
      const savedMarks: string[] = [];
      const savedTimes: Record<string, number> = {};
      for (const r of saved) {
        if (isOpt(r.selectedOption)) savedAnswers[r.questionId] = r.selectedOption;
        if (Array.isArray(r.selectedOptions)) {
          const opts = r.selectedOptions.filter(isOpt);
          if (opts.length > 0) savedMultiAnswers[r.questionId] = opts;
        }
        if (r.numericalResponse !== null && r.numericalResponse !== undefined && Number.isFinite(r.numericalResponse)) {
          savedNumAnswers[r.questionId] = r.numericalResponse;
        }
        if (r.isMarkedForReview) savedMarks.push(r.questionId);
        if (typeof r.timeSpentSeconds === "number" && r.timeSpentSeconds > 0) {
          savedTimes[r.questionId] = r.timeSpentSeconds;
        }
      }
      resume = { attemptId: inProgress.id, secondsLeft, savedAnswers, savedMultiAnswers, savedNumAnswers, savedMarks, savedTimes };
    }
  }

  return (
    <TakeTestClient
      test={{
        id: test.id,
        title: test.title,
        subject: test.subject,
        examType: test.examType ?? "Mixed",
        durationMinutes: test.durationMinutes,
        marksPerQuestion: test.marksPerQuestion,
        negativeMarkingPercent: test.negativeMarkingPercent,
        instructions: test.instructions,
      }}
      questions={questions}
      sections={sections}
      resume={resume}
    />
  );
}
