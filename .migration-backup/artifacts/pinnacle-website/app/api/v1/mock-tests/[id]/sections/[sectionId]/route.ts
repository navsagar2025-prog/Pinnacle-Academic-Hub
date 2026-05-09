import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { mockTests, mockTestSections } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

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

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string; sectionId: string }> }) {
  const { id: testId, sectionId } = await ctx.params;
  const auth = await authorize(testId);
  if ("error" in auth) return auth.error;
  const body = await req.json().catch(() => ({}));
  const updates: Partial<{ name: string; ordering: number; instructions: string | null }> = {};
  if (typeof body?.name === "string") {
    const v = body.name.trim();
    if (!v) return NextResponse.json({ error: "Section name cannot be empty" }, { status: 400 });
    updates.name = v;
  }
  if (typeof body?.ordering === "number" && Number.isInteger(body.ordering) && body.ordering >= 0) {
    updates.ordering = body.ordering;
  }
  if ("instructions" in body) {
    const v = body.instructions;
    updates.instructions = typeof v === "string" && v.trim() !== "" ? v : null;
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }
  const [updated] = await db.update(mockTestSections).set(updates)
    .where(and(eq(mockTestSections.id, sectionId), eq(mockTestSections.testId, testId)))
    .returning();
  if (!updated) return NextResponse.json({ error: "Section not found" }, { status: 404 });
  return NextResponse.json({ success: true, section: updated });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; sectionId: string }> }) {
  const { id: testId, sectionId } = await ctx.params;
  const auth = await authorize(testId);
  if ("error" in auth) return auth.error;
  // Questions in this section have sectionId set to null by FK ON DELETE SET NULL.
  const deleted = await db.delete(mockTestSections)
    .where(and(eq(mockTestSections.id, sectionId), eq(mockTestSections.testId, testId)))
    .returning({ id: mockTestSections.id });
  if (deleted.length === 0) return NextResponse.json({ error: "Section not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
