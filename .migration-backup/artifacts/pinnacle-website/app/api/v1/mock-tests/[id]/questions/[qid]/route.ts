import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { mockTests, mockTestQuestions } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; qid: string }> }) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: testId, qid } = await ctx.params;

  if (user.role === "teacher") {
    const [test] = await db.select({ createdBy: mockTests.createdBy }).from(mockTests).where(eq(mockTests.id, testId)).limit(1);
    if (!test || test.createdBy !== user.id) {
      return NextResponse.json({ error: "Forbidden — you can only delete questions from your own tests" }, { status: 403 });
    }
  }

  await db.delete(mockTestQuestions).where(and(eq(mockTestQuestions.id, qid), eq(mockTestQuestions.testId, testId)));
  return NextResponse.json({ success: true });
}
