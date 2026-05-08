import { Storage, type StorageOptions } from "@google-cloud/storage";
import { randomUUID } from "crypto";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

/**
 * Object storage works in two modes:
 *
 *  1. Replit mode (default in the Replit dev environment) — credentials are
 *     vended by the Replit object-storage sidecar at 127.0.0.1:1106 and signed
 *     URLs are obtained from a sidecar endpoint.
 *  2. Self-hosted GCS mode — used when running on OCI / any non-Replit host.
 *     Activated by setting GOOGLE_APPLICATION_CREDENTIALS_JSON (the inline
 *     service-account key JSON) or GOOGLE_APPLICATION_CREDENTIALS (a path to
 *     a key file). Signed URLs are produced by the @google-cloud/storage SDK
 *     directly — no sidecar required.
 */
const inlineCredsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
const credsFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const useSelfHostedGcs = Boolean(inlineCredsJson || credsFilePath);

function buildStorageClient(): Storage {
  if (useSelfHostedGcs) {
    const opts: StorageOptions = {};
    if (inlineCredsJson) {
      try {
        opts.credentials = JSON.parse(inlineCredsJson);
      } catch (err) {
        throw new Error(
          "GOOGLE_APPLICATION_CREDENTIALS_JSON is not valid JSON: " +
            (err as Error).message,
        );
      }
    }
    if (process.env.GOOGLE_CLOUD_PROJECT) {
      opts.projectId = process.env.GOOGLE_CLOUD_PROJECT;
    }
    return new Storage(opts);
  }
  return new Storage({
    credentials: {
      audience: "replit",
      subject_token_type: "access_token",
      token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
      type: "external_account",
      credential_source: {
        url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
        format: {
          type: "json",
          subject_token_field_name: "access_token",
        },
      },
      universe_domain: "googleapis.com",
    },
    projectId: "",
  } as ConstructorParameters<typeof Storage>[0]);
}

export const objectStorageClient: Storage = buildStorageClient();

function getPrivateObjectDir(): string {
  const dir = process.env.PRIVATE_OBJECT_DIR ?? "";
  if (!dir) throw new Error("PRIVATE_OBJECT_DIR not set — run setupObjectStorage()");
  return dir;
}

function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  if (!path.startsWith("/")) path = `/${path}`;
  const parts = path.split("/");
  if (parts.length < 3) throw new Error("Invalid object path");
  return { bucketName: parts[1], objectName: parts.slice(2).join("/") };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
  contentType,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT";
  ttlSec: number;
  contentType?: string;
}): Promise<string> {
  // Self-hosted GCS: sign directly via the SDK (no sidecar required).
  if (useSelfHostedGcs) {
    const file = objectStorageClient.bucket(bucketName).file(objectName);
    const [signed] = await file.getSignedUrl({
      version: "v4",
      action: method === "PUT" ? "write" : "read",
      expires: Date.now() + ttlSec * 1000,
      ...(contentType ? { contentType } : {}),
    });
    return signed;
  }

  // Replit sidecar mode.
  const body: Record<string, string> = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  if (contentType) body.content_type = contentType;

  const res = await fetch(`${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Failed to sign object URL: ${res.status}`);
  const { signed_url } = await res.json();
  return signed_url;
}

/**
 * Upload category determines the storage path and serving policy.
 *
 * Public categories are accessible without authentication from the serving route.
 * Private categories require admin auth to serve.
 */
export type UploadCategory =
  | "material_pdf"    // public — students/parents can download
  | "assignment_pdf"  // public — students can download
  | "faculty_photo"   // public — shown on public faculty page
  | "course_banner"   // public — shown on public courses page
  | "blog_image"      // public — shown on public blog page
  | "mock_test_image" // public — diagrams/figures inside mock-test questions
  | "question_figure" // public — figure images cropped from imported PYQ PDFs
  | "pyq_pdf";         // private — admin-only scanned PYQ source PDFs awaiting extraction

const CATEGORY_SUBPATH: Record<UploadCategory, string> = {
  material_pdf:    "public/materials",
  assignment_pdf:  "public/assignments",
  faculty_photo:   "public/faculty",
  course_banner:   "public/courses",
  blog_image:      "public/blog",
  mock_test_image: "public/mock-tests",
  question_figure: "public/question-figures",
  pyq_pdf:         "private/pyq-pdfs",
};

/**
 * Validate that the file's MIME type is allowed for the given category.
 * This provides server-side intent validation — the actual upload PUT is
 * content-type-bound via the signed URL's content_type parameter.
 */
export function validateCategoryMime(
  category: UploadCategory,
  contentType: string,
): { ok: true } | { ok: false; error: string } {
  const PDF = ["application/pdf"];
  const IMAGES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

  const isPdf = category === "material_pdf" || category === "assignment_pdf" || category === "pyq_pdf";
  const allowedMimes: string[] = isPdf ? PDF : IMAGES;

  if (!allowedMimes.includes(contentType)) {
    return {
      ok: false,
      error: `Category "${category}" only accepts: ${allowedMimes.join(", ")}. Received: ${contentType}`,
    };
  }
  return { ok: true };
}

export function validateSize(
  category: UploadCategory,
  size: number,
): { ok: true } | { ok: false; error: string } {
  const maxPdf = 20 * 1024 * 1024;
  const maxPyqPdf = 25 * 1024 * 1024;
  const maxImage = 5 * 1024 * 1024;
  let max: number;
  let label: string;
  if (category === "pyq_pdf") { max = maxPyqPdf; label = "25 MB"; }
  else if (category === "material_pdf" || category === "assignment_pdf") { max = maxPdf; label = "20 MB"; }
  else { max = maxImage; label = "5 MB"; }
  if (size > max) {
    return { ok: false, error: `File too large. Max ${label} for this category.` };
  }
  return { ok: true };
}

/** Read an entire object from storage into memory as a Buffer. */
export async function downloadObjectBytes(objectPath: string): Promise<{ bytes: Buffer; contentType: string }> {
  if (!objectPath.startsWith("/objects/")) throw new Error("Invalid object path");
  const entityId = objectPath.slice("/objects/".length);
  let dir = getPrivateObjectDir();
  if (!dir.endsWith("/")) dir = `${dir}/`;
  const fullPath = `${dir}${entityId}`;
  const { bucketName, objectName } = parseObjectPath(fullPath);
  const file = objectStorageClient.bucket(bucketName).file(objectName);
  const [exists] = await file.exists();
  if (!exists) throw new Error("Object not found");
  const [metadata] = await file.getMetadata();
  const [bytes] = await file.download();
  return { bytes, contentType: (metadata.contentType as string) || "application/octet-stream" };
}

/** Upload an in-memory buffer to object storage and return the object path + serving URL. */
export async function uploadBufferToCategory(
  category: UploadCategory,
  contentType: string,
  bytes: Buffer,
): Promise<{ objectPath: string }> {
  const privateObjectDir = getPrivateObjectDir();
  const objectId = randomUUID();
  const subpath = CATEGORY_SUBPATH[category];
  const fullPath = `${privateObjectDir}/${subpath}/${objectId}`;
  const { bucketName, objectName } = parseObjectPath(fullPath);
  const file = objectStorageClient.bucket(bucketName).file(objectName);
  await file.save(bytes, { contentType, resumable: false });
  return { objectPath: `/objects/${subpath}/${objectId}` };
}

export async function generateUploadURL(
  category: UploadCategory,
  contentType: string,
): Promise<{ uploadURL: string; objectPath: string; isPublic: boolean }> {
  const privateObjectDir = getPrivateObjectDir();
  const objectId = randomUUID();
  const subpath = CATEGORY_SUBPATH[category];
  const fullPath = `${privateObjectDir}/${subpath}/${objectId}`;
  const { bucketName, objectName } = parseObjectPath(fullPath);

  // Bind the presigned URL to the specific content-type so only that MIME is accepted by GCS
  const uploadURL = await signObjectURL({
    bucketName,
    objectName,
    method: "PUT",
    ttlSec: 900,
    contentType,
  });

  const objectPath = `/objects/${subpath}/${objectId}`;
  return { uploadURL, objectPath, isPublic: subpath.startsWith("public/") };
}

export function objectPathToServingUrl(objectPath: string, basePath = "/pinnacle-website"): string {
  return `${basePath}/api/v1/storage${objectPath}`;
}

/** Is this object path under the public prefix? */
export function isPublicObjectPath(objectPath: string): boolean {
  return objectPath.startsWith("/objects/public/");
}

export async function streamObject(objectPath: string): Promise<Response> {
  if (!objectPath.startsWith("/objects/")) {
    return new Response("Not found", { status: 404 });
  }
  const entityId = objectPath.slice("/objects/".length);
  let dir = getPrivateObjectDir();
  if (!dir.endsWith("/")) dir = `${dir}/`;
  const fullPath = `${dir}${entityId}`;
  const { bucketName, objectName } = parseObjectPath(fullPath);
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);
  const [exists] = await file.exists();
  if (!exists) return new Response("Not found", { status: 404 });
  const [metadata] = await file.getMetadata();
  const { Readable } = await import("stream");
  const nodeStream = file.createReadStream();
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;
  const isPublicPath = objectPath.startsWith("/objects/public/");
  const headers: Record<string, string> = {
    "Content-Type": (metadata.contentType as string) || "application/octet-stream",
    "Cache-Control": isPublicPath ? "public, max-age=86400" : "private, no-store",
  };
  if (metadata.size) headers["Content-Length"] = String(metadata.size);
  return new Response(webStream, { headers });
}
