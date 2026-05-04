import { NextRequest, NextResponse } from "next/server";
import { getDbUser, getTeacherPermissions } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { mockTests } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

async function verifyOwnership(user: { id: string; role: string }, testId: string) {
  if (user.role === "admin") return { allowed: true, test: null };

  const [test] = await db.select().from(mockTests).where(eq(mockTests.id, testId)).limit(1);
  if (!test) return { allowed: false, test: null };
  if (test.createdBy !== user.id) return { allowed: false, test };
  return { allowed: true, test };
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const { allowed } = await verifyOwnership(user, id);
  if (!allowed) return NextResponse.json({ error: "Forbidden — you can only edit your own tests" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  if (user.role === "teacher" && body.subject) {
    const perms = await getTeacherPermissions(user.id);
    if (!perms) return NextResponse.json({ error: "Teacher record not found" }, { status: 403 });
    if (!perms.allowedSubjects.includes(body.subject)) {
      return NextResponse.json({ error: `You can only use subjects: ${perms.allowedSubjects.join(", ")}` }, { status: 403 });
    }
  }

  const allowed_fields: Record<string, unknown> = {};
  for (const k of ["title", "subject", "examType", "batchId", "durationMinutes", "marksPerQuestion", "negativeMarkingPercent", "instructions", "isPublished", "isPublic"]) {
    if (k in body) allowed_fields[k] = body[k];
  }
  allowed_fields.updatedAt = new Date();

  const [updated] = await db.update(mockTests).set(allowed_fields).where(eq(mockTests.id, id)).returning();
  return NextResponse.json({ success: true, test: updated });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const { allowed } = await verifyOwnership(user, id);
  if (!allowed) return NextResponse.json({ error: "Forbidden — you can only delete your own tests" }, { status: 403 });

  await db.delete(mockTests).where(eq(mockTests.id, id));
  return NextResponse.json({ success: true });
}
