import { db } from "@workspace/db";
import { mockTests, mockTestQuestions, mockTestAttempts, mockTestAnswers, mockTestSections, students, users } from "@workspace/db/schema";
import { eq, and, asc, desc, sql } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Trophy, Target, Clock, CheckCircle2, ChevronLeft, Award, Users } from "lucide-react";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { QuestionReview } from "./QuestionReview";

function initials(name: string | null): string {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0][0] ?? "—").toUpperCase();
  return ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase();
}

export const metadata = { title: "Test Result — Student Portal" };

export default async function ResultPage({ params }: { params: Promise<{ id: string; attemptId: string }> }) {
  const dbUser = await requirePortalRole("student");
  const { id, attemptId } = await params;

  // Resolve the current student's record so we can scope the attempt to them.
  const [enrollment] = await db
    .select({ studentId: students.id })
    .from(students)
    .where(and(eq(students.userId, dbUser.id), eq(students.isActive, true)))
    .limit(1);
  if (!enrollment) notFound();

  // Scope the attempt strictly to the current student + the URL test id.
  const [attempt] = await db
    .select()
    .from(mockTestAttempts)
    .where(and(
      eq(mockTestAttempts.id, attemptId),
      eq(mockTestAttempts.testId, id),
      eq(mockTestAttempts.studentId, enrollment.studentId),
    ))
    .limit(1);
  if (!attempt) notFound();

  // Solutions/answers are only revealed for completed (graded) attempts.
  // Send the student back to the take page if the attempt is still in progress.
  if (!attempt.isCompleted) {
    redirect(`/portal/student/mock-tests/${id}/take`);
  }

  const [test] = await db.select().from(mockTests).where(eq(mockTests.id, id)).limit(1);
  if (!test) notFound();

  const questions = await db.select().from(mockTestQuestions)
    .where(eq(mockTestQuestions.testId, id))
    .orderBy(asc(mockTestQuestions.questionNumber));

  const userAnswers = await db.select().from(mockTestAnswers).where(eq(mockTestAnswers.attemptId, attemptId));
  const answerByQ = new Map(userAnswers.map((a) => [a.questionId, a]));

  // Rank & percentile across all completed attempts of this test (one best
  // attempt per student to keep rankings stable when retakes are allowed).
  const allCompleted = await db
    .select({
      attemptId: mockTestAttempts.id,
      studentId: mockTestAttempts.studentId,
      score: mockTestAttempts.score,
      maxScore: mockTestAttempts.maxScore,
      timeSpentSeconds: mockTestAttempts.timeSpentSeconds,
      studentName: users.name,
    })
    .from(mockTestAttempts)
    .leftJoin(students, eq(mockTestAttempts.studentId, students.id))
    .leftJoin(users, eq(students.userId, users.id))
    .where(and(eq(mockTestAttempts.testId, id), eq(mockTestAttempts.isCompleted, true)));

  // Keep one row per student — the highest score, ties broken by lowest time.
  const bestByStudent = new Map<string, typeof allCompleted[number]>();
  for (const row of allCompleted) {
    const key = row.studentId ?? `guest:${row.attemptId}`;
    const prev = bestByStudent.get(key);
    if (!prev || row.score > prev.score || (row.score === prev.score && row.timeSpentSeconds < prev.timeSpentSeconds)) {
      bestByStudent.set(key, row);
    }
  }
  const ranked = Array.from(bestByStudent.values())
    .sort((a, b) => (b.score - a.score) || (a.timeSpentSeconds - b.timeSpentSeconds));
  const totalParticipants = ranked.length;
  // Find current student's row (their *best* attempt) and use that for rank.
  const myKey = enrollment.studentId;
  const myRow = bestByStudent.get(myKey);
  const myIndex = myRow ? ranked.findIndex((r) => r.attemptId === myRow.attemptId) : -1;
  const myRank = myIndex >= 0 ? myIndex + 1 : null;
  // Percentile = % of participants strictly worse than me.
  const strictlyBelowCount = myRow
    ? ranked.filter((r) => r.score < myRow.score || (r.score === myRow.score && r.timeSpentSeconds > myRow.timeSpentSeconds)).length
    : 0;
  const percentile = totalParticipants > 0 ? Math.round((strictlyBelowCount / totalParticipants) * 100) : 0;
  const topScore = ranked[0]?.score ?? 0;
  const averageScore = totalParticipants > 0
    ? Math.round((ranked.reduce((sum, r) => sum + r.score, 0) / totalParticipants) * 10) / 10
    : 0;
  // Top 5 leaderboard for context.
  const leaderboard = ranked.slice(0, 5).map((r, i) => ({
    rank: i + 1,
    initials: initials(r.studentName),
    score: r.score,
    maxScore: r.maxScore,
    isMe: r.attemptId === myRow?.attemptId,
  }));
  const isMyAttemptTheBest = myRow?.attemptId === attempt.id;

  // Sections (optional) — for section-wise breakdown below.
  const sections = await db.select().from(mockTestSections)
    .where(eq(mockTestSections.testId, id))
    .orderBy(asc(mockTestSections.ordering), asc(mockTestSections.createdAt));
  const sectionById = new Map(sections.map((s) => [s.id, s]));

  const accuracy = attempt.attemptedCount > 0 ? Math.round((attempt.correctCount / attempt.attemptedCount) * 100) : 0;
  const percentage = attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0;
  const timeMin = Math.floor(attempt.timeSpentSeconds / 60);
  const timeSec = attempt.timeSpentSeconds % 60;

  // Topic-wise analysis
  const topicMap = new Map<string, { total: number; correct: number; wrong: number; skipped: number }>();
  for (const q of questions) {
    const topic = q.topic ?? "General";
    if (!topicMap.has(topic)) topicMap.set(topic, { total: 0, correct: 0, wrong: 0, skipped: 0 });
    const s = topicMap.get(topic)!;
    s.total++;
    const ans = answerByQ.get(q.id);
    const attempted = q.questionType === "multi"
      ? (ans?.selectedOptions?.length ?? 0) > 0
      : q.questionType === "numerical"
      ? ans?.numericalResponse !== null && ans?.numericalResponse !== undefined
      : Boolean(ans?.selectedOption);
    if (!attempted) s.skipped++;
    else if (ans?.isCorrect) s.correct++;
    else s.wrong++;
  }
  const topicRows = Array.from(topicMap.entries()).map(([topic, s]) => ({
    topic, ...s, pct: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
  })).sort((a, b) => b.pct - a.pct);

  // Section-wise breakdown (only shown when test has sections defined).
  type SecAgg = { total: number; correct: number; wrong: number; skipped: number; earned: number; max: number };
  const secMap = new Map<string, SecAgg>();
  // Pre-seed with all defined sections so empty ones still appear.
  for (const s of sections) secMap.set(s.id, { total: 0, correct: 0, wrong: 0, skipped: 0, earned: 0, max: 0 });
  let hasUnsectioned = false;
  for (const q of questions) {
    const key = q.sectionId && sectionById.has(q.sectionId) ? q.sectionId : "__none__";
    if (key === "__none__") hasUnsectioned = true;
    if (!secMap.has(key)) secMap.set(key, { total: 0, correct: 0, wrong: 0, skipped: 0, earned: 0, max: 0 });
    const s = secMap.get(key)!;
    s.total++;
    s.max += test.marksPerQuestion;
    const ans = answerByQ.get(q.id);
    const attempted = q.questionType === "multi"
      ? (ans?.selectedOptions?.length ?? 0) > 0
      : q.questionType === "numerical"
      ? ans?.numericalResponse !== null && ans?.numericalResponse !== undefined
      : Boolean(ans?.selectedOption);
    if (!attempted) s.skipped++;
    else if (ans?.isCorrect) s.correct++;
    else s.wrong++;
    s.earned += Number(ans?.marksAwarded ?? 0);
  }
  const sectionRows = sections.length > 0
    ? [
        ...sections.map((s) => ({ id: s.id, name: s.name, ...(secMap.get(s.id)!) })),
        ...(hasUnsectioned ? [{ id: "__none__", name: "General", ...(secMap.get("__none__")!) }] : []),
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal/student/mock-tests" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[var(--color-teal)] mb-2">
          <ChevronLeft size={14} /> All tests
        </Link>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Test Report</h1>
        <p className="text-slate-500 text-sm mt-1">{test.title}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card border-l-4 border-l-[var(--color-gold)]">
          <Trophy size={18} className="text-[var(--color-gold)] mb-1" />
          <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
            {attempt.score}<span className="text-sm text-slate-400">/{attempt.maxScore}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Score · {percentage}%</div>
        </div>
        <div className="card border-l-4 border-l-[var(--color-teal)]">
          <Target size={18} className="text-[var(--color-teal)] mb-1" />
          <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{accuracy}%</div>
          <div className="text-xs text-slate-500 mt-1">Accuracy</div>
        </div>
        <div className="card border-l-4 border-l-blue-400">
          <CheckCircle2 size={18} className="text-blue-500 mb-1" />
          <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
            {attempt.correctCount}<span className="text-sm text-slate-400">/{attempt.totalQuestions}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Correct · {attempt.wrongCount} wrong · {attempt.totalQuestions - attempt.attemptedCount} skipped</div>
        </div>
        <div className="card border-l-4 border-l-slate-400">
          <Clock size={18} className="text-slate-500 mb-1" />
          <div className="text-2xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{timeMin}<span className="text-sm text-slate-400">m {timeSec}s</span></div>
          <div className="text-xs text-slate-500 mt-1">Time spent · of {test.durationMinutes}m</div>
        </div>
      </div>

      {/* Rank, percentile, leaderboard */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <Award size={18} className="text-[var(--color-gold)]" />
            <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">Your Rank</h2>
          </div>
          {totalParticipants === 0 || myRank === null ? (
            <p className="text-sm text-slate-500">Not enough data yet.</p>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">
                  #{myRank}
                </div>
                <div className="text-sm text-slate-500">of {totalParticipants}</div>
              </div>
              <div className="mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[var(--color-teal)]/10 text-[var(--color-teal)] font-medium">
                {percentile}<sup>th</sup> percentile
              </div>
              {!isMyAttemptTheBest && (
                <p className="text-xs text-slate-500 mt-2">
                  Rank uses your best attempt at this test.
                </p>
              )}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
                <div>
                  <div className="text-xs text-slate-500">Top score</div>
                  <div className="text-sm font-bold text-[var(--color-navy)]">{topScore}/{attempt.maxScore}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Average</div>
                  <div className="text-sm font-bold text-[var(--color-navy)]">{averageScore}/{attempt.maxScore}</div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Users size={18} className="text-[var(--color-teal)]" />
            <h2 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">Top performers</h2>
          </div>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-slate-500">No completed attempts yet.</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((row) => (
                <div
                  key={row.rank}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                    row.isMe ? "bg-[var(--color-gold)]/10 ring-1 ring-[var(--color-gold)]/40" : "bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      row.rank === 1 ? "bg-[var(--color-gold)] text-white"
                      : row.rank === 2 ? "bg-slate-300 text-slate-700"
                      : row.rank === 3 ? "bg-amber-700 text-white"
                      : "bg-slate-200 text-slate-600"
                    }`}>{row.rank}</div>
                    <div className="text-sm font-medium text-[var(--color-navy)]">
                      {row.isMe ? "You" : row.initials}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-[var(--color-navy)]">
                    {row.score}<span className="text-xs text-slate-400">/{row.maxScore}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section-wise breakdown */}
      {sectionRows.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">Section-wise Performance</h2>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="text-left py-2 pr-3 font-medium">Section</th>
                  <th className="text-right py-2 px-3 font-medium">Attempted</th>
                  <th className="text-right py-2 px-3 font-medium">Correct</th>
                  <th className="text-right py-2 px-3 font-medium">Wrong</th>
                  <th className="text-right py-2 px-3 font-medium">Accuracy</th>
                  <th className="text-right py-2 pl-3 font-medium">Marks</th>
                </tr>
              </thead>
              <tbody>
                {sectionRows.map((s) => {
                  const att = s.total - s.skipped;
                  const acc = att > 0 ? Math.round((s.correct / att) * 100) : 0;
                  const earned = Math.round(s.earned * 10) / 10;
                  return (
                    <tr key={s.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="py-2 pr-3 font-medium text-[var(--color-navy)]">{s.name}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{att}/{s.total}</td>
                      <td className="py-2 px-3 text-right text-emerald-600 font-medium">{s.correct}</td>
                      <td className="py-2 px-3 text-right text-[var(--color-maroon)] font-medium">{s.wrong}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{acc}%</td>
                      <td className="py-2 pl-3 text-right font-bold text-[var(--color-navy)]">{earned}<span className="text-xs text-slate-400">/{s.max}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Topic-wise analysis */}
      {topicRows.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">Topic-wise Analysis</h2>
          <div className="space-y-3">
            {topicRows.map((row) => (
              <div key={row.topic}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-[var(--color-navy)]">{row.topic}</span>
                  <span className="text-xs text-slate-500">
                    {row.correct}/{row.total} correct · {row.pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full transition-all ${
                    row.pct >= 75 ? "bg-[var(--color-teal)]"
                    : row.pct >= 50 ? "bg-[var(--color-gold)]"
                    : "bg-[var(--color-maroon)]"
                  }`} style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-question review with filters and solutions */}
      <QuestionReview
        questions={questions.map((q) => {
          const ans = answerByQ.get(q.id);
          return {
            id: q.id,
            questionNumber: q.questionNumber,
            questionType: q.questionType,
            topic: q.topic,
            questionText: q.questionText,
            imageUrl: q.imageUrl,
            optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD,
            optionAImageUrl: q.optionAImageUrl,
            optionBImageUrl: q.optionBImageUrl,
            optionCImageUrl: q.optionCImageUrl,
            optionDImageUrl: q.optionDImageUrl,
            correctOption: q.correctOption,
            correctOptions: q.correctOptions,
            numericalAnswer: q.numericalAnswer,
            numericalTolerance: q.numericalTolerance,
            explanation: q.explanation,
            explanationImageUrl: q.explanationImageUrl,
            selectedOption: ans?.selectedOption ?? null,
            selectedOptions: ans?.selectedOptions ?? null,
            numericalResponse: ans?.numericalResponse ?? null,
            isCorrect: ans?.isCorrect ?? null,
            marksAwarded: ans?.marksAwarded ?? null,
          };
        })}
      />
    </div>
  );
}
