import { auth } from "@clerk/nextjs/server";
import { db } from "@workspace/db";
import { studyMaterials, users, batches, students, teachers } from "@workspace/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { paginatedOk, created, err } from "@/lib/server/api-response";

async function getDbUser(clerkUserId: string) {
  const [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  return user ?? null;
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return err("Unauthorized", 401);

  const dbUser = await getDbUser(userId);
  if (!dbUser) return err("User not found", 404);

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
        return paginatedOk([], 0, page, limit);
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

    return paginatedOk(rows, count, page, limit);
  } catch (e) {
    console.error("GET /api/v1/materials error:", e);
    return err("Failed to fetch materials");
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return err("Unauthorized", 401);

  const dbUser = await getDbUser(userId);
  if (!dbUser || (dbUser.role !== "teacher" && dbUser.role !== "admin")) {
    return err("Forbidden: Only teachers and admins can upload materials", 403);
  }

  try {
    const body = await request.json();
    const { title, subject, type, batchId, fileUrl, description } = body;
    if (!title || !fileUrl || !batchId) {
      return err("title, fileUrl, and batchId are required", 400);
    }

    const [row] = await db
      .insert(studyMaterials)
      .values({
        title,
        subject: subject ?? "General",
        type: type ?? "Notes",
        batchId,
        fileUrl,
        uploadedBy: dbUser.id,
        isVisible: true,
      })
      .returning();

    return created(row);
  } catch (e) {
    console.error("POST /api/v1/materials error:", e);
    return err("Failed to upload material");
  }
}
