import { NextRequest, NextResponse } from "next/server";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { mockTests } from "@workspace/db/schema";

export async function POST(req: NextRequest) {
  let user;
  try { user = await requirePortalRole("admin"); } catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  const body = await req.json().catch(() => null);
  const { title, subject, examType, batchId, durationMinutes, marksPerQuestion, negativeMarkingPercent, instructions, isPublic } = body ?? {};
  if (!title || !subject) return NextResponse.json({ error: "title and subject are required" }, { status: 400 });

  const [created] = await db.insert(mockTests).values({
    title,
    subject,
    examType: examType ?? "Mixed",
    batchId: batchId || null,
    durationMinutes: Number(durationMinutes) || 60,
    marksPerQuestion: Number(marksPerQuestion) || 4,
    negativeMarkingPercent: Number(negativeMarkingPercent) || 25,
    instructions: instructions ?? null,
    isPublic: Boolean(isPublic),
    createdBy: user.id,
  }).returning();

  return NextResponse.json({ success: true, test: created });
}
