import { NextRequest, NextResponse } from "next/server";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { mockTestQuestions } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try { await requirePortalRole("admin"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { id: testId } = await ctx.params;
  const body = await req.json().catch(() => null);
  const { questionText, optionA, optionB, optionC, optionD, correctOption, topic, explanation, imageUrl } = body ?? {};
  if (!questionText || !optionA || !optionB || !optionC || !optionD || !["A", "B", "C", "D"].includes(correctOption)) {
    return NextResponse.json({ error: "All four options, question text, and correctOption (A|B|C|D) are required" }, { status: 400 });
  }

  const [{ next }] = await db.select({ next: sql<number>`coalesce(max(${mockTestQuestions.questionNumber}), 0) + 1` })
    .from(mockTestQuestions).where(eq(mockTestQuestions.testId, testId));

  const [created] = await db.insert(mockTestQuestions).values({
    testId, questionNumber: next, questionText, optionA, optionB, optionC, optionD, correctOption,
    topic: topic ?? null, explanation: explanation ?? null, imageUrl: imageUrl ?? null,
  }).returning();

  return NextResponse.json({ success: true, question: created });
}
