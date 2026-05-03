import { NextRequest, NextResponse } from "next/server";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { doubts, students } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  let user;
  try { user = await requirePortalRole("student"); } catch { return NextResponse.json({ error: "Login required" }, { status: 401 }); }

  const body = await req.json().catch(() => null);
  const subject = typeof body?.subject === "string" ? body.subject.trim().slice(0, 100) : "";
  const topic = typeof body?.topic === "string" ? body.topic.trim().slice(0, 200) : "";
  const questionText = typeof body?.questionText === "string" ? body.questionText.trim().slice(0, 5000) : "";
  const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.slice(0, 500) : null;
  if (!subject || !questionText) return NextResponse.json({ error: "Subject and question are required" }, { status: 400 });

  const [student] = await db.select({ id: students.id, batchId: students.batchId })
    .from(students).where(and(eq(students.userId, user.id), eq(students.isActive, true))).limit(1);

  if (!student) return NextResponse.json({ error: "Active enrollment required to post doubts" }, { status: 403 });

  const [created] = await db.insert(doubts).values({
    studentId: student.id,
    batchId: student.batchId,
    subject,
    topic: topic || null,
    questionText,
    imageUrl,
  }).returning();

  return NextResponse.json({ success: true, doubt: created });
}
