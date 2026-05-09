import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { mockTests, mockTestQuestions, mockTestSections } from "@workspace/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { validateMockTestImageUrl } from "@/lib/server/image-url";

const VALID_OPTS = ["A", "B", "C", "D"] as const;
type Opt = (typeof VALID_OPTS)[number];
const isOpt = (v: unknown): v is Opt =>
  typeof v === "string" && (VALID_OPTS as readonly string[]).includes(v);

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: testId } = await ctx.params;

  const [test] = await db.select({ createdBy: mockTests.createdBy }).from(mockTests).where(eq(mockTests.id, testId)).limit(1);
  if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });
  if (user.role === "teacher" && test.createdBy !== user.id) {
    return NextResponse.json({ error: "Forbidden — you can only add questions to your own tests" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const {
    questionType: rawType,
    sectionId: rawSectionId,
    questionText, optionA, optionB, optionC, optionD, correctOption,
    correctOptions: rawCorrectOptions,
    numericalAnswer: rawNumAnswer, numericalTolerance: rawNumTol,
    topic, explanation,
    imageUrl: imageUrlRaw, optionAImageUrl: aImgRaw, optionBImageUrl: bImgRaw,
    optionCImageUrl: cImgRaw, optionDImageUrl: dImgRaw, explanationImageUrl: exImgRaw,
  } = body ?? {};

  // Validate sectionId belongs to this test (or is null/empty for "general").
  let sectionId: string | null = null;
  if (typeof rawSectionId === "string" && rawSectionId.trim() !== "") {
    const [sec] = await db.select({ id: mockTestSections.id }).from(mockTestSections)
      .where(and(eq(mockTestSections.id, rawSectionId), eq(mockTestSections.testId, testId))).limit(1);
    if (!sec) return NextResponse.json({ error: "Invalid sectionId — section does not belong to this test" }, { status: 400 });
    sectionId = sec.id;
  }

  const questionType: "mcq" | "multi" | "numerical" =
    rawType === "multi" || rawType === "numerical" ? rawType : "mcq";

  let imageUrl: string | null;
  let optionAImageUrl: string | null;
  let optionBImageUrl: string | null;
  let optionCImageUrl: string | null;
  let optionDImageUrl: string | null;
  let explanationImageUrl: string | null;
  try {
    imageUrl            = validateMockTestImageUrl(imageUrlRaw);
    optionAImageUrl     = validateMockTestImageUrl(aImgRaw);
    optionBImageUrl     = validateMockTestImageUrl(bImgRaw);
    optionCImageUrl     = validateMockTestImageUrl(cImgRaw);
    optionDImageUrl     = validateMockTestImageUrl(dImgRaw);
    explanationImageUrl = validateMockTestImageUrl(exImgRaw);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Invalid image URL" }, { status: 400 });
  }

  const hasText = (v: unknown) => typeof v === "string" && v.trim() !== "";
  if (!(hasText(questionText) || imageUrl)) {
    return NextResponse.json({ error: "Question text or image is required" }, { status: 400 });
  }

  // Per-type validation.
  let correctOptions: Opt[] | null = null;
  let numericalAnswer: number | null = null;
  let numericalTolerance: number | null = null;
  let mcqCorrect: Opt | null = null;

  if (questionType === "mcq") {
    if (!(hasText(optionA) || optionAImageUrl) || !(hasText(optionB) || optionBImageUrl) ||
        !(hasText(optionC) || optionCImageUrl) || !(hasText(optionD) || optionDImageUrl)) {
      return NextResponse.json({ error: "All four options (text or image each) are required" }, { status: 400 });
    }
    if (!isOpt(correctOption)) {
      return NextResponse.json({ error: "correctOption must be A, B, C, or D" }, { status: 400 });
    }
    mcqCorrect = correctOption;
  } else if (questionType === "multi") {
    if (!(hasText(optionA) || optionAImageUrl) || !(hasText(optionB) || optionBImageUrl) ||
        !(hasText(optionC) || optionCImageUrl) || !(hasText(optionD) || optionDImageUrl)) {
      return NextResponse.json({ error: "All four options (text or image each) are required" }, { status: 400 });
    }
    const arr = Array.isArray(rawCorrectOptions) ? rawCorrectOptions.filter(isOpt) : [];
    const uniq = Array.from(new Set(arr)) as Opt[];
    if (uniq.length < 1) {
      return NextResponse.json({ error: "Pick at least one correct option for a multi-correct question" }, { status: 400 });
    }
    correctOptions = uniq.sort();
  } else {
    // numerical
    const n = Number(rawNumAnswer);
    if (rawNumAnswer === null || rawNumAnswer === undefined || rawNumAnswer === "" || !Number.isFinite(n)) {
      return NextResponse.json({ error: "Numerical answer is required and must be a number" }, { status: 400 });
    }
    const tol = rawNumTol === null || rawNumTol === undefined || rawNumTol === "" ? 0 : Number(rawNumTol);
    if (!Number.isFinite(tol) || tol < 0) {
      return NextResponse.json({ error: "Tolerance must be a non-negative number" }, { status: 400 });
    }
    numericalAnswer = n;
    numericalTolerance = tol;
  }

  const [{ next }] = await db.select({ next: sql<number>`coalesce(max(${mockTestQuestions.questionNumber}), 0) + 1` })
    .from(mockTestQuestions).where(eq(mockTestQuestions.testId, testId));

  const isOptionType = questionType !== "numerical";

  const [created] = await db.insert(mockTestQuestions).values({
    testId,
    sectionId,
    questionNumber: next,
    questionText: typeof questionText === "string" ? questionText : "",
    questionType,
    optionA: isOptionType && typeof optionA === "string" ? optionA : null,
    optionB: isOptionType && typeof optionB === "string" ? optionB : null,
    optionC: isOptionType && typeof optionC === "string" ? optionC : null,
    optionD: isOptionType && typeof optionD === "string" ? optionD : null,
    correctOption: mcqCorrect,
    correctOptions,
    numericalAnswer,
    numericalTolerance,
    topic: topic ?? null,
    explanation: explanation ?? null,
    imageUrl,
    optionAImageUrl: isOptionType ? optionAImageUrl : null,
    optionBImageUrl: isOptionType ? optionBImageUrl : null,
    optionCImageUrl: isOptionType ? optionCImageUrl : null,
    optionDImageUrl: isOptionType ? optionDImageUrl : null,
    explanationImageUrl,
  }).returning();

  return NextResponse.json({ success: true, question: created });
}
