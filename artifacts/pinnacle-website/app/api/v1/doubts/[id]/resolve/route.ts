import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { doubts, students } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const isResolved = body?.isResolved !== false;

  const role = user.role ?? "student";
  const isStaff = role === "teacher" || role === "admin";

  const [doubt] = await db.select({ id: doubts.id, studentId: doubts.studentId })
    .from(doubts).where(eq(doubts.id, id)).limit(1);
  if (!doubt) return NextResponse.json({ error: "Doubt not found" }, { status: 404 });

  if (!isStaff) {
    const [s] = await db.select({ id: students.id }).from(students)
      .where(and(eq(students.userId, user.id), eq(students.isActive, true))).limit(1);
    if (!s || s.id !== doubt.studentId) {
      return NextResponse.json({ error: "You can only modify your own doubts" }, { status: 403 });
    }
  }

  await db.update(doubts).set({
    isResolved,
    status: isResolved ? "resolved" : "open",
    updatedAt: new Date(),
  }).where(eq(doubts.id, id));

  return NextResponse.json({ success: true });
}
