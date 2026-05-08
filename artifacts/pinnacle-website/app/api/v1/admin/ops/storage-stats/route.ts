/**
 * GET /api/v1/admin/ops/storage-stats
 * Admin-only. Returns object-storage bucket usage: total object count and total bytes.
 *
 * GET ?scan=orphans lists storage objects whose paths are not referenced by any
 * DB row (study_materials.file_url, practice_papers.file_url, blog_posts.featured_image_url,
 * gallery_items.image_url, assignments.file_url).
 */
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";
import { getDbUser } from "@/lib/server/portal-auth";
import { objectStorageClient } from "@/lib/server/object-storage";

export const runtime = "nodejs";

async function getBucketStats(bucketId: string) {
  const bucket = objectStorageClient.bucket(bucketId);
  const [files] = await bucket.getFiles({ maxResults: 10000 });
  let totalBytes = 0;
  for (const f of files) {
    totalBytes += parseInt(f.metadata.size as string ?? "0", 10);
  }
  return { objectCount: files.length, totalBytes };
}

async function findOrphanedFiles(bucketId: string) {
  const bucket = objectStorageClient.bucket(bucketId);
  const [files] = await bucket.getFiles({ maxResults: 10000 });

  // Gather all known referenced file paths from the DB.
  const [refs] = await Promise.all([
    db.execute(sql`
      SELECT file_url AS url FROM study_materials WHERE file_url IS NOT NULL
      UNION ALL
      SELECT file_url AS url FROM practice_papers WHERE file_url IS NOT NULL
      UNION ALL
      SELECT featured_image_url AS url FROM blog_posts WHERE featured_image_url IS NOT NULL
      UNION ALL
      SELECT image_url AS url FROM gallery_items WHERE image_url IS NOT NULL
      UNION ALL
      SELECT file_url AS url FROM assignments WHERE file_url IS NOT NULL
      UNION ALL
      SELECT file_url AS url FROM assignment_schedules WHERE file_url IS NOT NULL
    `),
  ]);

  // Build a set of referenced paths (strip leading slash / bucket prefix noise).
  const referenced = new Set<string>();
  for (const row of refs.rows) {
    const raw = (row.url as string) ?? "";
    // Extract the path component after the bucket or origin prefix.
    const u = raw.replace(/^https?:\/\/[^/]+\//, "").replace(/^\//, "");
    referenced.add(u);
    referenced.add(raw); // also add full URL for direct match
  }

  const orphans = files
    .filter((f) => {
      const name = f.name;
      return !referenced.has(name) && !referenced.has(`/${name}`) &&
        !Array.from(referenced).some((r) => r.endsWith(name) || name.endsWith(r));
    })
    .map((f) => ({
      name: f.name,
      sizeBytes: parseInt(f.metadata.size as string ?? "0", 10),
      updated: f.metadata.updated,
    }));

  return orphans;
}

export async function GET(request: Request) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden — admin only", 403);

  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) {
    return ok({ configured: false, objectCount: 0, totalBytes: 0, orphans: null });
  }

  const { searchParams } = new URL(request.url);
  const scanOrphans = searchParams.get("scan") === "orphans";

  try {
    if (scanOrphans) {
      const orphans = await findOrphanedFiles(bucketId);
      return ok({ configured: true, orphans });
    }

    const stats = await getBucketStats(bucketId);
    return ok({ configured: true, ...stats, orphans: null });
  } catch (e) {
    console.error("storage-stats error:", e);
    return err("Storage stats unavailable: " + (e as Error).message);
  }
}
