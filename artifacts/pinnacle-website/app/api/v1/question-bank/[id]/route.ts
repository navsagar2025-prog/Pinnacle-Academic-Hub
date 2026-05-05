import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { questionBank } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const [q] = await db.select().from(questionBank).where(eq(questionBank.id, id)).limit(1);
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, question: q });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of ["subject", "topic", "classGrade", "difficulty", "questionType", "questionText", "correctAnswer", "solution", "imageUrl", "solutionImageUrl", "examName", "isPublished"] as const) {
    if (k in body) updates[k] = body[k];
  }
  if ("year" in body) updates.year = body.year ? Number(body.year) : null;
  if ("marks" in body) updates.marks = body.marks ? Number(body.marks) : 4;
  if ("options" in body) updates.options = body.options ?? null;

  await db.update(questionBank).set(updates).where(eq(questionBank.id, id));
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  await db.delete(questionBank).where(eq(questionBank.id, id));
  return NextResponse.json({ success: true });
}
