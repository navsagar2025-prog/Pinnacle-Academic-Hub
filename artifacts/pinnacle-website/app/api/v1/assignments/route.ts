import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import { assignments, batches } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { getDbUser } from "@/lib/server/portal-auth";
import { logAudit } from "@/lib/server/audit";

export async function GET(req: NextRequest) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId");

  const rows = await db
    .select({
      id: assignments.id,
      title: assignments.title,
      subject: assignments.subject,
      description: assignments.description,
      fileUrl: assignments.fileUrl,
      dueDate: assignments.dueDate,
      maxMarks: assignments.maxMarks,
      isVisible: assignments.isVisible,
      createdAt: assignments.createdAt,
      batchId: assignments.batchId,
      batchName: batches.name,
    })
    .from(assignments)
    .leftJoin(batches, eq(assignments.batchId, batches.id))
    .where(batchId ? eq(assignments.batchId, batchId) : undefined)
    .orderBy(desc(assignments.createdAt));

  return NextResponse.json({ success: true, data: rows });
}

export async function POST(req: NextRequest) {
  const user = await getDbUser();
  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    title?: string;
    subject?: string;
    batchId?: string;
    description?: string;
    fileUrl?: string;
    dueDate?: string;
    maxMarks?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, subject, batchId, description, fileUrl, dueDate, maxMarks } = body;
  if (!title || !subject || !batchId || !dueDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [row] = await db
    .insert(assignments)
    .values({
      title,
      subject,
      batchId,
      description: description ?? null,
      fileUrl: fileUrl ?? null,
      dueDate: new Date(dueDate),
      maxMarks: maxMarks ?? null,
      postedBy: user.id,
      isVisible: true,
    })
    .returning({ id: assignments.id });

  logAudit(user.id, user.name ?? "unknown", "create", "assignment", row.id, { title }).catch(
    console.error,
  );

  return NextResponse.json({ success: true, id: row.id });
}
