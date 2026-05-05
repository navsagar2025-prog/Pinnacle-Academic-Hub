import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { practiceSets, practiceSetQuestions, practiceSetAssignments } from "@workspace/db/schema";
import { listAllSetsForStaff } from "@/lib/server/practice-sets";

function isStaff(role: string | undefined) {
  return role === "admin" || role === "teacher";
}

export async function GET() {
  const user = await getDbUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sets = await listAllSetsForStaff();
  return NextResponse.json({ sets });
}

export async function POST(req: NextRequest) {
  const user = await getDbUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    description?: string | null;
    subject?: string | null;
    questionIds?: string[];
    assignments?: Array<{ batchId?: string; studentId?: string; dueAt?: string | null }>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Set name is required" }, { status: 400 });

  const questionIds = Array.from(new Set(body.questionIds ?? [])).filter((s) => typeof s === "string" && s.length > 0);
  const assignments = (body.assignments ?? []).filter(
    (a) => (a.batchId && !a.studentId) || (!a.batchId && a.studentId),
  );

  const [created] = await db
    .insert(practiceSets)
    .values({
      name,
      description: body.description?.toString().trim() || null,
      subject: body.subject?.toString().trim() || null,
      createdBy: user.id,
    })
    .returning();

  if (questionIds.length > 0) {
    await db.insert(practiceSetQuestions).values(
      questionIds.map((qid, idx) => ({
        setId: created.id,
        questionId: qid,
        sortOrder: idx,
      })),
    );
  }

  if (assignments.length > 0) {
    await db.insert(practiceSetAssignments).values(
      assignments.map((a) => ({
        setId: created.id,
        batchId: a.batchId || null,
        studentId: a.studentId || null,
        assignedBy: user.id,
        dueAt: a.dueAt ? new Date(a.dueAt) : null,
      })),
    );
  }

  return NextResponse.json({ set: created }, { status: 201 });
}
