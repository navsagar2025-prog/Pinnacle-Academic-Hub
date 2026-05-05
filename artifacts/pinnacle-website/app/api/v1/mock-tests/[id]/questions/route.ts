import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { mockTests, mockTestQuestions } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { validateMockTestImageUrl } from "@/lib/server/image-url";

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
    questionText, optionA, optionB, optionC, optionD, correctOption, topic, explanation,
    imageUrl: imageUrlRaw, optionAImageUrl: aImgRaw, optionBImageUrl: bImgRaw,
    optionCImageUrl: cImgRaw, optionDImageUrl: dImgRaw, explanationImageUrl: exImgRaw,
  } = body ?? {};

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

  // A question must have either question text OR a question image, and each option must have text OR an image.
  const hasText = (v: unknown) => typeof v === "string" && v.trim() !== "";
  const hasQuestionContent = hasText(questionText) || imageUrl;
  if (!hasQuestionContent ||
      !(hasText(optionA) || optionAImageUrl) || !(hasText(optionB) || optionBImageUrl) ||
      !(hasText(optionC) || optionCImageUrl) || !(hasText(optionD) || optionDImageUrl) ||
      !["A", "B", "C", "D"].includes(correctOption)) {
    return NextResponse.json({
      error: "Question text or image, all four options (text or image each), and correctOption (A|B|C|D) are required",
    }, { status: 400 });
  }

  const [{ next }] = await db.select({ next: sql<number>`coalesce(max(${mockTestQuestions.questionNumber}), 0) + 1` })
    .from(mockTestQuestions).where(eq(mockTestQuestions.testId, testId));

  const [created] = await db.insert(mockTestQuestions).values({
    testId,
    questionNumber: next,
    questionText: typeof questionText === "string" ? questionText : "",
    optionA: typeof optionA === "string" ? optionA : "",
    optionB: typeof optionB === "string" ? optionB : "",
    optionC: typeof optionC === "string" ? optionC : "",
    optionD: typeof optionD === "string" ? optionD : "",
    correctOption,
    topic: topic ?? null,
    explanation: explanation ?? null,
    imageUrl,
    optionAImageUrl,
    optionBImageUrl,
    optionCImageUrl,
    optionDImageUrl,
    explanationImageUrl,
  }).returning();

  return NextResponse.json({ success: true, question: created });
}
