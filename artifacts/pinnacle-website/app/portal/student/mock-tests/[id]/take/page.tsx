import { db } from "@workspace/db";
import { mockTests, mockTestQuestions } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { TakeTestClient } from "./TakeTestClient";

export const metadata = { title: "Take Test — Student Portal" };

export default async function TakeTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [test] = await db.select().from(mockTests).where(eq(mockTests.id, id)).limit(1);
  if (!test || !test.isPublished) notFound();

  const questions = await db
    .select({
      id: mockTestQuestions.id,
      questionNumber: mockTestQuestions.questionNumber,
      questionText: mockTestQuestions.questionText,
      optionA: mockTestQuestions.optionA,
      optionB: mockTestQuestions.optionB,
      optionC: mockTestQuestions.optionC,
      optionD: mockTestQuestions.optionD,
      topic: mockTestQuestions.topic,
    })
    .from(mockTestQuestions)
    .where(eq(mockTestQuestions.testId, id))
    .orderBy(asc(mockTestQuestions.questionNumber));

  if (questions.length === 0) {
    return (
      <div className="card text-center py-10">
        <p className="text-slate-500">This test has no questions yet.</p>
      </div>
    );
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
    />
  );
}
