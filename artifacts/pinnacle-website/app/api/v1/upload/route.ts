import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import {
  generateUploadURL,
  validateCategoryMime,
  validateSize,
  type UploadCategory,
} from "@/lib/server/object-storage";
import { rateLimit, extractIp } from "@/lib/server/rate-limit";

const VALID_CATEGORIES: UploadCategory[] = [
  "material_pdf",
  "assignment_pdf",
  "faculty_photo",
  "course_banner",
  "blog_image",
  "mock_test_image",
  "question_figure",
  "pyq_pdf",
];

const ADMIN_ONLY_CATEGORIES: UploadCategory[] = [
  "faculty_photo",
  "course_banner",
  "blog_image",
  "pyq_pdf",
  "question_figure",
];

export async function POST(req: NextRequest) {
  const user = await getDbUser();
  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate-limit: 30 upload URL requests per user per hour (tunable via
  // site_settings "security_rate_limits" → "api.upload"). Prevents storage
  // exhaustion from a single compromised account.
  const ip = extractIp(req);
  const { allowed } = await rateLimit(
    `user:${user.id}`,
    "api.upload",
    30,
    60 * 60_000,
    { ip, actorEmail: user.email },
  );
  if (!allowed) {
    return NextResponse.json({ error: "Upload rate limit exceeded. Please wait before uploading more files." }, { status: 429 });
  }

  let body: { name?: string; size?: number; contentType?: string; category?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, size, contentType, category } = body;

  if (!name || typeof size !== "number" || !contentType || !category) {
    return NextResponse.json(
      { error: "Missing required fields: name, size, contentType, category" },
      { status: 400 },
    );
  }

  if (!VALID_CATEGORIES.includes(category as UploadCategory)) {
    return NextResponse.json(
      { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
      { status: 400 },
    );
  }

  const cat = category as UploadCategory;

  if (ADMIN_ONLY_CATEGORIES.includes(cat) && user.role !== "admin") {
    return NextResponse.json({ error: `Only admins can upload files in category "${cat}"` }, { status: 403 });
  }

  const mimeCheck = validateCategoryMime(cat, contentType);
  if (!mimeCheck.ok) {
    return NextResponse.json({ error: mimeCheck.error }, { status: 415 });
  }

  const sizeCheck = validateSize(cat, size);
  if (!sizeCheck.ok) {
    return NextResponse.json({ error: sizeCheck.error }, { status: 413 });
  }

  try {
    const { uploadURL, objectPath, isPublic } = await generateUploadURL(cat, contentType);
    return NextResponse.json({
      uploadURL,
      objectPath,
      isPublic,
      metadata: { name, size, contentType, category },
    });
  } catch (err) {
    console.error("[upload] Error generating presigned URL:", err);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
