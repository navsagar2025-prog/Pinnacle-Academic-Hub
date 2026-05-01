import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export const objectStorageClient = new Storage({
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
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT";
  ttlSec: number;
}): Promise<string> {
  const res = await fetch(`${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket_name: bucketName,
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Failed to sign object URL: ${res.status}`);
  const { signed_url } = await res.json();
  return signed_url;
}

export async function generateUploadURL(): Promise<{ uploadURL: string; objectPath: string }> {
  const privateObjectDir = getPrivateObjectDir();
  const objectId = randomUUID();
  const fullPath = `${privateObjectDir}/uploads/${objectId}`;
  const { bucketName, objectName } = parseObjectPath(fullPath);
  const uploadURL = await signObjectURL({ bucketName, objectName, method: "PUT", ttlSec: 900 });
  const objectPath = `/objects/uploads/${objectId}`;
  return { uploadURL, objectPath };
}

export function objectPathToServingUrl(objectPath: string, basePath = "/pinnacle-website"): string {
  return `${basePath}/api/v1/storage${objectPath}`;
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
  const headers: Record<string, string> = {
    "Content-Type": (metadata.contentType as string) || "application/octet-stream",
    "Cache-Control": "public, max-age=86400",
  };
  if (metadata.size) headers["Content-Length"] = String(metadata.size);
  return new Response(webStream, { headers });
}
