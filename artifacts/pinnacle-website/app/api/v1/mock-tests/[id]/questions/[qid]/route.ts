import { NextRequest, NextResponse } from "next/server";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { mockTestQuestions } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; qid: string }> }) {
  try { await requirePortalRole("admin"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { qid } = await ctx.params;
  await db.delete(mockTestQuestions).where(eq(mockTestQuestions.id, qid));
  return NextResponse.json({ success: true });
}
