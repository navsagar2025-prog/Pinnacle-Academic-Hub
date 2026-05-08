import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { studyMaterials, users, batches, students } from "@workspace/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { paginatedOk, created, err } from "@/lib/server/api-response";

export async function GET(request: Request) {
  const dbUser = await getDbUser();
  if (!dbUser) return err("Unauthorized", 401);

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
        // Internal storage URL; never returned to clients. Used here only as
        // a presence flag so we can decide whether to expose `downloadUrl`.
        _hasFile: sql<boolean>`(${studyMaterials.fileUrl} is not null)`,
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

    // Strip the internal storage URL from the wire payload and replace it
    // with the watermarking download proxy URL. This keeps every PDF
    // delivery on a single audited code path.
    const shaped = rows.map(({ _hasFile, ...r }) => ({
      ...r,
      downloadUrl: _hasFile ? `/pinnacle-website/api/v1/downloads/study_material/${r.id}` : null,
    }));

    return paginatedOk(shaped, count, page, limit);
  } catch (e) {
    console.error("GET /api/v1/materials error:", e);
    return err("Failed to fetch materials");
  }
}

export async function POST(request: Request) {
  const dbUser = await getDbUser();
  if (!dbUser) return err("Unauthorized", 401);
  if (dbUser.role !== "teacher" && dbUser.role !== "admin") {
    return err("Forbidden: Only teachers and admins can upload materials", 403);
  }

  try {
    const body = await request.json();
    const { title, subject, type, batchId, fileUrl } = body;
    if (!title || !fileUrl || !batchId) {
      return err("title, fileUrl, and batchId are required", 400);
    }
    if (typeof fileUrl !== "string" || !/\/objects\/public\/materials\//.test(fileUrl)) {
      return err("fileUrl must reference /objects/public/materials/...", 400);
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
