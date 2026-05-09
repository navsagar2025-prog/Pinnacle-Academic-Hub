import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { doubtAnswers, doubtAnswerVotes } from "@workspace/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string; aid: string }> }) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { aid } = await ctx.params;

  const [existing] = await db.select({ id: doubtAnswerVotes.id }).from(doubtAnswerVotes)
    .where(and(eq(doubtAnswerVotes.answerId, aid), eq(doubtAnswerVotes.userId, user.id))).limit(1);

  if (existing) {
    await db.delete(doubtAnswerVotes).where(eq(doubtAnswerVotes.id, existing.id));
    await db.update(doubtAnswers).set({ upvotes: sql`greatest(${doubtAnswers.upvotes} - 1, 0)` }).where(eq(doubtAnswers.id, aid));
    return NextResponse.json({ success: true, upvoted: false });
  }
  await db.insert(doubtAnswerVotes).values({ answerId: aid, userId: user.id });
  await db.update(doubtAnswers).set({ upvotes: sql`${doubtAnswers.upvotes} + 1` }).where(eq(doubtAnswers.id, aid));
  return NextResponse.json({ success: true, upvoted: true });
}
