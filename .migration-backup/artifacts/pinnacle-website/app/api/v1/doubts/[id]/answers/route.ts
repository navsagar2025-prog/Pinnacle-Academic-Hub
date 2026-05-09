import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { doubts, doubtAnswers, students } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: doubtId } = await ctx.params;
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const answerText = typeof body?.answerText === "string" ? body.answerText.trim().slice(0, 5000) : "";
  const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.slice(0, 500) : null;
  if (!answerText) return NextResponse.json({ error: "Answer is required" }, { status: 400 });

  const role = user.role ?? "student";
  const isStaff = role === "teacher" || role === "admin";

  const result = await db.transaction(async (tx) => {
    const [doubt] = await tx.select().from(doubts)
      .where(eq(doubts.id, doubtId)).for("update").limit(1);
    if (!doubt) return { status: 404, body: { error: "Doubt not found" } };

    // Students can only reply to their own doubts
    if (!isStaff) {
      const [s] = await tx.select({ id: students.id }).from(students)
        .where(and(eq(students.userId, user.id), eq(students.isActive, true))).limit(1);
      if (!s || s.id !== doubt.studentId) {
        return { status: 403, body: { error: "You can only reply to your own doubts" } };
      }
    }

    const [created] = await tx.insert(doubtAnswers).values({
      doubtId, authorId: user.id, authorRole: role,
      answerText, imageUrl,
    }).returning();

    const updates: Record<string, unknown> = {
      answerCount: sql`${doubts.answerCount} + 1`,
      updatedAt: new Date(),
    };
    if (isStaff) {
      updates.status = "answered";
      updates.isResolved = true;
    }
    await tx.update(doubts).set(updates).where(eq(doubts.id, doubtId));

    return { status: 200, body: { success: true, answer: created } };
  });

  return NextResponse.json(result.body, { status: result.status });
}
