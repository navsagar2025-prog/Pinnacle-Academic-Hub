import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { generateUploadURL } from "@/lib/server/object-storage";

const ALLOWED_PDF_TYPES = ["application/pdf"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_PDF_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const user = await getDbUser();
  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; size?: number; contentType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, size, contentType } = body;
  if (!name || typeof size !== "number" || !contentType) {
    return NextResponse.json({ error: "Missing name, size, or contentType" }, { status: 400 });
  }

  const isPdf = ALLOWED_PDF_TYPES.includes(contentType);
  const isImage = ALLOWED_IMAGE_TYPES.includes(contentType);

  if (!isPdf && !isImage) {
    return NextResponse.json(
      { error: "File type not allowed. Only PDFs and images are accepted." },
      { status: 415 },
    );
  }
  if (isPdf && size > MAX_PDF_BYTES) {
    return NextResponse.json({ error: "PDF files must be under 20 MB" }, { status: 413 });
  }
  if (isImage && size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image files must be under 5 MB" }, { status: 413 });
  }

  try {
    const { uploadURL, objectPath } = await generateUploadURL();
    return NextResponse.json({ uploadURL, objectPath, metadata: { name, size, contentType } });
  } catch (err) {
    console.error("[upload] Error generating presigned URL:", err);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
