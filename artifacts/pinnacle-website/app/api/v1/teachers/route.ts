import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import { teachers, users } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { paginatedOk, err } from "@/lib/server/api-response";
import { getDbUser } from "@/lib/server/portal-auth";
import { randomUUID } from "crypto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;

  try {
    const rows = await db
      .select({
        id: teachers.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        designation: teachers.designation,
        qualification: teachers.qualification,
        subjects: teachers.subjects,
        experienceYears: teachers.experienceYears,
        initials: teachers.initials,
        bio: teachers.bio,
        isActive: teachers.isActive,
        joinedAt: teachers.joinedAt,
      })
      .from(teachers)
      .leftJoin(users, eq(teachers.userId, users.id))
      .where(eq(teachers.isActive, true))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(teachers)
      .where(eq(teachers.isActive, true));

    return paginatedOk(rows, count, page, limit);
  } catch (e) {
    console.error("GET /api/v1/teachers error:", e);
    return err("Failed to fetch teachers");
  }
}

export async function POST(req: NextRequest) {
  const actor = await getDbUser();
  if (!actor || actor.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    email?: string;
    phone?: string;
    designation?: string;
    qualification?: string;
    subjects?: string[];
    experienceYears?: number;
    bio?: string;
    initials?: string;
    photoUrl?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, designation, phone, qualification, subjects, experienceYears, bio, initials, photoUrl } = body;
  if (!name || !email || !designation) {
    return NextResponse.json({ error: "name, email, and designation are required" }, { status: 400 });
  }

  let [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);

  if (!existingUser) {
    [existingUser] = await db
      .insert(users)
      .values({ clerkUserId: `admin-pending-${randomUUID()}`, name, email, phone: phone ?? null, role: "teacher" })
      .returning({ id: users.id });
  } else {
    await db.update(users).set({ name, phone: phone ?? null, role: "teacher" }).where(eq(users.id, existingUser.id));
  }

  const [existingTeacher] = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(eq(teachers.userId, existingUser.id))
    .limit(1);

  if (existingTeacher) {
    await db.update(teachers).set({
      designation, qualification: qualification ?? null, subjects: subjects ?? null,
      experienceYears: experienceYears ?? null, bio: bio ?? null, initials: initials ?? null,
      photoUrl: photoUrl ?? null, isActive: true, updatedAt: new Date(),
    }).where(eq(teachers.id, existingTeacher.id));
    return NextResponse.json({ success: true, id: existingTeacher.id });
  }

  const [newTeacher] = await db.insert(teachers).values({
    userId: existingUser.id, designation, qualification: qualification ?? null,
    subjects: subjects ?? null, experienceYears: experienceYears ?? null,
    bio: bio ?? null, initials: initials ?? null, photoUrl: photoUrl ?? null,
    isActive: true,
  }).returning({ id: teachers.id });

  return NextResponse.json({ success: true, id: newTeacher.id });
}
