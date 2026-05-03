import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { doubtAnswers, doubts } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string; aid: string }> }) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (user.role !== "teacher" && user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: doubtId, aid } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const isOfficial = body?.isOfficial !== false;

  if (isOfficial) {
    await db.update(doubtAnswers).set({ isOfficial: false }).where(eq(doubtAnswers.doubtId, doubtId));
  }
  await db.update(doubtAnswers).set({ isOfficial }).where(eq(doubtAnswers.id, aid));
  if (isOfficial) {
    await db.update(doubts).set({ isResolved: true, status: "resolved", updatedAt: new Date() }).where(eq(doubts.id, doubtId));
  }
  return NextResponse.json({ success: true, isOfficial });
}
