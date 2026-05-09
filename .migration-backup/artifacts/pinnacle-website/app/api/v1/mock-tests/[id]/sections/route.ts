import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { mockTests, mockTestSections } from "@workspace/db/schema";
import { eq, asc, sql } from "drizzle-orm";

async function authorize(testId: string) {
  const user = await getDbUser();
  if (!user) return { error: NextResponse.json({ error: "Login required" }, { status: 401 }) };
  if (user.role !== "admin" && user.role !== "teacher") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  const [test] = await db.select({ createdBy: mockTests.createdBy }).from(mockTests).where(eq(mockTests.id, testId)).limit(1);
  if (!test) return { error: NextResponse.json({ error: "Test not found" }, { status: 404 }) };
  if (user.role === "teacher" && test.createdBy !== user.id) {
    return { error: NextResponse.json({ error: "Forbidden — you can only edit your own tests" }, { status: 403 }) };
  }
  return { user };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: testId } = await ctx.params;
  const sections = await db.select().from(mockTestSections)
    .where(eq(mockTestSections.testId, testId))
    .orderBy(asc(mockTestSections.ordering), asc(mockTestSections.createdAt));
  return NextResponse.json({ sections });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: testId } = await ctx.params;
  const auth = await authorize(testId);
  if ("error" in auth) return auth.error;
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Section name is required" }, { status: 400 });
  const instructions = typeof body?.instructions === "string" && body.instructions.trim() !== "" ? body.instructions : null;
  const [{ next }] = await db.select({ next: sql<number>`coalesce(max(${mockTestSections.ordering}), -1) + 1` })
    .from(mockTestSections).where(eq(mockTestSections.testId, testId));
  const [created] = await db.insert(mockTestSections).values({
    testId, name, ordering: next, instructions,
  }).returning();
  return NextResponse.json({ success: true, section: created });
}
