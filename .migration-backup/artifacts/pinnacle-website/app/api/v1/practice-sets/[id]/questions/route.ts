import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { practiceSetQuestions } from "@workspace/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

function isStaff(role: string | undefined) {
  return role === "admin" || role === "teacher";
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user || !isStaff(user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: setId } = await params;

  let body: { questionIds?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const ids = Array.from(new Set(body.questionIds ?? [])).filter((s) => typeof s === "string" && s.length > 0);
  if (ids.length === 0) return NextResponse.json({ added: 0 });

  // current max sortOrder so new rows append at the end
  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${practiceSetQuestions.sortOrder}), -1)::int` })
    .from(practiceSetQuestions)
    .where(eq(practiceSetQuestions.setId, setId));

  // skip questions already in the set
  const existing = await db
    .select({ qid: practiceSetQuestions.questionId })
    .from(practiceSetQuestions)
    .where(and(eq(practiceSetQuestions.setId, setId), inArray(practiceSetQuestions.questionId, ids)));
  const have = new Set(existing.map((e) => e.qid));
  const toInsert = ids.filter((q) => !have.has(q));
  if (toInsert.length === 0) return NextResponse.json({ added: 0 });

  await db.insert(practiceSetQuestions).values(
    toInsert.map((qid, i) => ({ setId, questionId: qid, sortOrder: maxOrder + 1 + i })),
  );
  return NextResponse.json({ added: toInsert.length });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user || !isStaff(user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: setId } = await params;

  const url = new URL(req.url);
  const questionId = url.searchParams.get("questionId");
  if (!questionId) return NextResponse.json({ error: "questionId required" }, { status: 400 });

  await db
    .delete(practiceSetQuestions)
    .where(and(eq(practiceSetQuestions.setId, setId), eq(practiceSetQuestions.questionId, questionId)));
  return NextResponse.json({ ok: true });
}
