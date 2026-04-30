import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@workspace/db";
import { studyMaterials, users, batches, students, teachers } from "@workspace/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";

async function getDbUser(clerkUserId: string) {
  const [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  return user ?? null;
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const dbUser = await getDbUser(userId);
  if (!dbUser) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject");
  const type = searchParams.get("type");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;

  try {
    const conditions: ReturnType<typeof eq>[] = [
      eq(studyMaterials.isVisible, true) as ReturnType<typeof eq>,
    ];

    if (dbUser.role === "student") {
      const [enrollment] = await db
        .select({ batchId: students.batchId })
        .from(students)
        .where(and(eq(students.userId, dbUser.id), eq(students.isActive, true)))
        .limit(1);
      if (enrollment?.batchId) {
        conditions.push(eq(studyMaterials.batchId, enrollment.batchId) as ReturnType<typeof eq>);
      } else {
        return NextResponse.json({ success: true, data: [], meta: { total: 0, page, limit, pages: 0 } });
      }
    } else if (dbUser.role === "teacher") {
      conditions.push(eq(studyMaterials.uploadedBy, dbUser.id) as ReturnType<typeof eq>);
    }

    if (subject) conditions.push(eq(studyMaterials.subject, subject) as ReturnType<typeof eq>);
    if (type) {
      conditions.push(
        eq(studyMaterials.type, type as typeof studyMaterials.type._.data) as ReturnType<typeof eq>
      );
    }

    const whereClause = and(...conditions);

    const rows = await db
      .select({
        id: studyMaterials.id,
        title: studyMaterials.title,
        subject: studyMaterials.subject,
        type: studyMaterials.type,
        fileUrl: studyMaterials.fileUrl,
        fileSize: studyMaterials.fileSize,
        downloadCount: studyMaterials.downloadCount,
        createdAt: studyMaterials.createdAt,
        batchName: batches.name,
        uploadedByName: users.name,
      })
      .from(studyMaterials)
      .leftJoin(batches, eq(studyMaterials.batchId, batches.id))
      .leftJoin(users, eq(studyMaterials.uploadedBy, users.id))
      .where(whereClause)
      .orderBy(asc(studyMaterials.subject), asc(studyMaterials.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(studyMaterials)
      .where(whereClause);

    return NextResponse.json({
      success: true,
      data: rows,
      meta: { total: count, page, limit, pages: Math.ceil(Math.max(1, count) / limit) },
    });
  } catch (err) {
    console.error("GET /api/v1/materials error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch materials" }, { status: 500 });
  }
}
