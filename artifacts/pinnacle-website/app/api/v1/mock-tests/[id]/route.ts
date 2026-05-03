import { NextRequest, NextResponse } from "next/server";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { mockTests } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try { await requirePortalRole("admin"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const allowed: Record<string, unknown> = {};
  for (const k of ["title", "subject", "examType", "batchId", "durationMinutes", "marksPerQuestion", "negativeMarkingPercent", "instructions", "isPublished", "isPublic"]) {
    if (k in body) allowed[k] = body[k];
  }
  allowed.updatedAt = new Date();

  const [updated] = await db.update(mockTests).set(allowed).where(eq(mockTests.id, id)).returning();
  return NextResponse.json({ success: true, test: updated });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try { await requirePortalRole("admin"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { id } = await ctx.params;
  await db.delete(mockTests).where(eq(mockTests.id, id));
  return NextResponse.json({ success: true });
}
