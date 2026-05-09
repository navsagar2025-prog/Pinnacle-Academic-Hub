import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import { teachers, users } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { getDbUser } from "@/lib/server/portal-auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getDbUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: {
    designation?: string;
    qualification?: string;
    subjects?: string[];
    experienceYears?: number;
    bio?: string;
    initials?: string;
    photoUrl?: string;
    isActive?: boolean;
    isExaminer?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { designation, qualification, subjects, experienceYears, bio, initials, photoUrl, isActive, isExaminer } = body;

  await db
    .update(teachers)
    .set({
      ...(designation !== undefined && { designation }),
      ...(qualification !== undefined && { qualification }),
      ...(subjects !== undefined && { subjects }),
      ...(experienceYears !== undefined && { experienceYears }),
      ...(bio !== undefined && { bio }),
      ...(initials !== undefined && { initials }),
      ...(photoUrl !== undefined && { photoUrl }),
      ...(isActive !== undefined && { isActive }),
      ...(isExaminer !== undefined && { isExaminer }),
      updatedAt: new Date(),
    })
    .where(eq(teachers.id, id));

  return NextResponse.json({ success: true });
}
