import { db } from "@workspace/db";
import {
  practiceSets,
  practiceSetQuestions,
  practiceSetAssignments,
  questionBank,
  questionAttempts,
  students,
  batches,
  users,
} from "@workspace/db/schema";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";

/**
 * Returns the IDs of practice sets currently assigned to a student — either
 * directly (assignment.studentId = student) or via their batch
 * (assignment.batchId = student.batchId). Inactive sets are filtered out.
 */
export async function getStudentAssignedSetIds(studentId: string): Promise<string[]> {
  const [stu] = await db
    .select({ batchId: students.batchId })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  const batchId = stu?.batchId ?? null;
  const conds = batchId
    ? or(eq(practiceSetAssignments.studentId, studentId), eq(practiceSetAssignments.batchId, batchId))
    : eq(practiceSetAssignments.studentId, studentId);

  const rows = await db
    .selectDistinct({ setId: practiceSetAssignments.setId })
    .from(practiceSetAssignments)
    .innerJoin(practiceSets, eq(practiceSetAssignments.setId, practiceSets.id))
    .where(and(conds, eq(practiceSets.isActive, true)));

  return rows.map((r) => r.setId);
}

/**
 * True iff `studentId` has access to `setId` via any active assignment.
 */
export async function studentCanAccessSet(studentId: string, setId: string): Promise<boolean> {
  const ids = await getStudentAssignedSetIds(studentId);
  return ids.includes(setId);
}

/**
 * True iff a student can practise `questionId` directly — i.e. the question
 * appears in at least one set the student has been assigned. Used to gate
 * `/portal/student/question-bank/[id]`.
 */
export async function studentCanAccessQuestion(studentId: string, questionId: string): Promise<boolean> {
  const setIds = await getStudentAssignedSetIds(studentId);
  if (setIds.length === 0) return false;
  const [hit] = await db
    .select({ id: practiceSetQuestions.id })
    .from(practiceSetQuestions)
    .where(and(inArray(practiceSetQuestions.setId, setIds), eq(practiceSetQuestions.questionId, questionId)))
    .limit(1);
  return !!hit;
}

export type AssignedSetSummary = {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  dueAt: Date | null;
  questionCount: number;
  attemptedCount: number;
  correctCount: number;
  scope: "batch" | "student";
};

/**
 * Lists the sets visible to a student with per-set progress (questions in the
 * set, how many the student has attempted, how many correct). Earliest due
 * date first; undated sets last.
 */
export async function getStudentAssignedSets(studentId: string): Promise<AssignedSetSummary[]> {
  const [stu] = await db
    .select({ batchId: students.batchId })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  const batchId = stu?.batchId ?? null;
  const conds = batchId
    ? or(eq(practiceSetAssignments.studentId, studentId), eq(practiceSetAssignments.batchId, batchId))
    : eq(practiceSetAssignments.studentId, studentId);

  // Per-set scope (batch vs student) + earliest due date for that student.
  const assignments = await db
    .select({
      setId: practiceSetAssignments.setId,
      // earliest dueAt across all assignments touching this student for this set
      dueAt: sql<Date | null>`min(${practiceSetAssignments.dueAt})`,
      // student-specific assignment trumps batch for "scope" labeling
      hasStudentScope: sql<boolean>`bool_or(${practiceSetAssignments.studentId} is not null)`,
    })
    .from(practiceSetAssignments)
    .innerJoin(practiceSets, eq(practiceSetAssignments.setId, practiceSets.id))
    .where(and(conds, eq(practiceSets.isActive, true)))
    .groupBy(practiceSetAssignments.setId);

  if (assignments.length === 0) return [];

  const setIds = assignments.map((a) => a.setId);

  const sets = await db
    .select({
      id: practiceSets.id,
      name: practiceSets.name,
      description: practiceSets.description,
      subject: practiceSets.subject,
      questionCount: sql<number>`(
        select count(*)::int from ${practiceSetQuestions}
        where ${practiceSetQuestions.setId} = ${practiceSets.id}
      )`,
    })
    .from(practiceSets)
    .where(inArray(practiceSets.id, setIds));

  // Per-set attempt counts for this student. We count distinct questionIds the
  // student has attempted within each set's question list — re-attempts of the
  // same question collapse to one toward "attempted", and "correct" requires
  // their LAST attempt for that question to be correct.
  const lastAttempt = db
    .select({
      questionId: questionAttempts.questionId,
      isCorrect: sql<boolean | null>`(array_agg(${questionAttempts.isCorrect} order by ${questionAttempts.createdAt} desc))[1]`.as("last_correct"),
    })
    .from(questionAttempts)
    .where(eq(questionAttempts.studentId, studentId))
    .groupBy(questionAttempts.questionId)
    .as("last_attempt");

  const progressRows = await db
    .select({
      setId: practiceSetQuestions.setId,
      attempted: sql<number>`count(${lastAttempt.questionId})::int`,
      correct: sql<number>`count(*) filter (where ${lastAttempt.isCorrect} = true)::int`,
    })
    .from(practiceSetQuestions)
    .leftJoin(lastAttempt, eq(lastAttempt.questionId, practiceSetQuestions.questionId))
    .where(inArray(practiceSetQuestions.setId, setIds))
    .groupBy(practiceSetQuestions.setId);

  const progressBySet = new Map(progressRows.map((r) => [r.setId, r]));
  const assignBySet = new Map(assignments.map((a) => [a.setId, a]));

  const out: AssignedSetSummary[] = sets.map((s) => {
    const a = assignBySet.get(s.id)!;
    const p = progressBySet.get(s.id);
    return {
      id: s.id,
      name: s.name,
      description: s.description,
      subject: s.subject,
      dueAt: a.dueAt,
      questionCount: s.questionCount,
      attemptedCount: p?.attempted ?? 0,
      correctCount: p?.correct ?? 0,
      scope: a.hasStudentScope ? "student" : "batch",
    };
  });

  // earliest due first; undated last; then alphabetical name as a tie-breaker
  out.sort((a, b) => {
    if (a.dueAt && b.dueAt) return a.dueAt.getTime() - b.dueAt.getTime();
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return a.name.localeCompare(b.name);
  });
  return out;
}

/**
 * Lists every set with metadata for the staff (admin/teacher) management page.
 */
export async function listAllSetsForStaff() {
  return db
    .select({
      id: practiceSets.id,
      name: practiceSets.name,
      subject: practiceSets.subject,
      description: practiceSets.description,
      isActive: practiceSets.isActive,
      createdAt: practiceSets.createdAt,
      createdByName: users.name,
      questionCount: sql<number>`(
        select count(*)::int from ${practiceSetQuestions}
        where ${practiceSetQuestions.setId} = ${practiceSets.id}
      )`,
      assignmentCount: sql<number>`(
        select count(*)::int from ${practiceSetAssignments}
        where ${practiceSetAssignments.setId} = ${practiceSets.id}
      )`,
    })
    .from(practiceSets)
    .leftJoin(users, eq(practiceSets.createdBy, users.id))
    .orderBy(desc(practiceSets.createdAt));
}

export type SetDetail = {
  set: typeof practiceSets.$inferSelect;
  questions: Array<{
    id: string;
    sortOrder: number;
    question: typeof questionBank.$inferSelect;
  }>;
  assignments: Array<{
    id: string;
    batchId: string | null;
    batchName: string | null;
    studentId: string | null;
    studentName: string | null;
    studentRoll: string | null;
    dueAt: Date | null;
    createdAt: Date;
  }>;
};

export async function getSetDetail(setId: string): Promise<SetDetail | null> {
  const [set] = await db.select().from(practiceSets).where(eq(practiceSets.id, setId)).limit(1);
  if (!set) return null;

  const qRows = await db
    .select({
      id: practiceSetQuestions.id,
      sortOrder: practiceSetQuestions.sortOrder,
      question: questionBank,
    })
    .from(practiceSetQuestions)
    .innerJoin(questionBank, eq(practiceSetQuestions.questionId, questionBank.id))
    .where(eq(practiceSetQuestions.setId, setId))
    .orderBy(practiceSetQuestions.sortOrder, practiceSetQuestions.createdAt);

  const aRows = await db
    .select({
      id: practiceSetAssignments.id,
      batchId: practiceSetAssignments.batchId,
      batchName: batches.name,
      studentId: practiceSetAssignments.studentId,
      studentName: users.name,
      studentRoll: students.rollNumber,
      dueAt: practiceSetAssignments.dueAt,
      createdAt: practiceSetAssignments.createdAt,
    })
    .from(practiceSetAssignments)
    .leftJoin(batches, eq(practiceSetAssignments.batchId, batches.id))
    .leftJoin(students, eq(practiceSetAssignments.studentId, students.id))
    .leftJoin(users, eq(students.userId, users.id))
    .where(eq(practiceSetAssignments.setId, setId))
    .orderBy(desc(practiceSetAssignments.createdAt));

  return { set, questions: qRows, assignments: aRows };
}
