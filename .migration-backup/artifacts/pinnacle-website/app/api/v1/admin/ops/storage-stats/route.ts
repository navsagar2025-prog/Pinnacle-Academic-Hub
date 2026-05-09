/**
 * GET /api/v1/admin/ops/storage-stats
 * Admin-only. Returns object-storage bucket usage: total object count and total bytes.
 * Paginates through all objects so counts are accurate for buckets > 10k files.
 *
 * GET ?scan=orphans lists storage objects whose paths are not referenced by any
 * DB row (study_materials.file_url, blog_posts.featured_image_url, gallery_items.image_url,
 * assignments.file_url, etc.).
 */
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";
import { getRealAdminUser } from "@/lib/server/portal-auth";
import { objectStorageClient } from "@/lib/server/object-storage";
import type { File as GcsFile, GetFilesOptions } from "@google-cloud/storage";

export const runtime = "nodejs";

/**
 * Iterate all objects in the bucket with pagination, collecting every File.
 * GCS uses a pageToken cursor; we cap at 200 pages (2 M objects) as a safety net.
 */
async function getAllFiles(bucketId: string): Promise<GcsFile[]> {
  const bucket = objectStorageClient.bucket(bucketId);
  const allFiles: GcsFile[] = [];
  const MAX_PAGES = 200;
  let pageToken: string | undefined;
  let page = 0;

  do {
    const opts: GetFilesOptions = { maxResults: 1000 };
    if (pageToken) opts.pageToken = pageToken;

    const [files, , apiResponse] = await bucket.getFiles(opts);
    allFiles.push(...files);
    pageToken = (apiResponse as { nextPageToken?: string } | undefined)?.nextPageToken;
    page++;
  } while (pageToken && page < MAX_PAGES);

  return allFiles;
}

async function getBucketStats(bucketId: string) {
  const files = await getAllFiles(bucketId);
  let totalBytes = 0;
  for (const f of files) {
    totalBytes += parseInt(f.metadata.size as string ?? "0", 10);
  }
  return { objectCount: files.length, totalBytes };
}

async function findOrphanedFiles(bucketId: string) {
  const [files, refs] = await Promise.all([
    getAllFiles(bucketId),
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

  // Build a set of path fragments from every known DB URL.
  const referenced = new Set<string>();
  for (const row of refs.rows) {
    const raw = (row.url as string) ?? "";
    const stripped = raw.replace(/^https?:\/\/[^/]+\//, "").replace(/^\//, "");
    referenced.add(raw);
    referenced.add(stripped);
  }

  const orphans = files
    .filter((f: GcsFile) => {
      const name = f.name;
      return !Array.from(referenced).some(
        (r) => r === name || r === `/${name}` || r.endsWith(`/${name}`) || name.endsWith(r.replace(/^\//, "")),
      );
    })
    .map((f: GcsFile) => ({
      name: f.name,
      sizeBytes: parseInt((f.metadata.size as string) ?? "0", 10),
      updated: f.metadata.updated as string | undefined,
    }));

  return orphans;
}

export async function GET(request: Request) {
  const actor = await getRealAdminUser();
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
