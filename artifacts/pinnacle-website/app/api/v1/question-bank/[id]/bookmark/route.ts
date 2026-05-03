import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { questionBookmarks, students } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";

async function studentIdFor(userId: string) {
  const [s] = await db.select({ id: students.id })
    .from(students).where(and(eq(students.userId, userId), eq(students.isActive, true))).limit(1);
  return s?.id ?? null;
}

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const sid = await studentIdFor(user.id);
  if (!sid) return NextResponse.json({ error: "Active enrollment required" }, { status: 403 });
  const { id: questionId } = await ctx.params;

  const [existing] = await db.select({ id: questionBookmarks.id }).from(questionBookmarks)
    .where(and(eq(questionBookmarks.studentId, sid), eq(questionBookmarks.questionId, questionId))).limit(1);
  if (existing) return NextResponse.json({ success: true, bookmarked: true });

  await db.insert(questionBookmarks).values({ studentId: sid, questionId });
  return NextResponse.json({ success: true, bookmarked: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const sid = await studentIdFor(user.id);
  if (!sid) return NextResponse.json({ error: "Active enrollment required" }, { status: 403 });
  const { id: questionId } = await ctx.params;

  await db.delete(questionBookmarks).where(and(eq(questionBookmarks.studentId, sid), eq(questionBookmarks.questionId, questionId)));
  return NextResponse.json({ success: true, bookmarked: false });
}
