import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export type PortalRole = "student" | "parent" | "teacher" | "admin";

/**
 * Server-side utility: verifies the signed-in user has the required role.
 * Redirects to /sign-in if not authenticated, or /unauthorized if wrong role.
 * Returns the DB user record on success.
 */
export async function requirePortalRole(requiredRole: PortalRole) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.clerkUserId, userId))
    .limit(1);

  if (!user) {
    redirect("/sign-in");
  }

  if (user.role !== requiredRole) {
    const rolePortalMap: Record<string, string> = {
      student: "/portal/student",
      parent: "/portal/parent",
      teacher: "/portal/teacher",
      admin: "/portal/admin",
    };
    const correctPortal = rolePortalMap[user.role];
    if (correctPortal) {
      redirect(correctPortal);
    } else {
      redirect("/sign-in");
    }
  }

  return user;
}

/**
 * Resolves the DB user for any authenticated Clerk user.
 * Does NOT enforce role — use requirePortalRole for role enforcement.
 * Returns null if the user has no DB record.
 */
export async function getDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.clerkUserId, userId))
    .limit(1);

  return user ?? null;
}

/**
 * Creates a DB user record when they sign in for the first time via Clerk.
 * Call from portal layout server component.
 */
export async function upsertDbUser(clerkUser: {
  id: string;
  fullName: string | null;
  primaryEmailAddress: { emailAddress: string } | null;
  phoneNumbers: Array<{ phoneNumber: string }>;
}) {
  const email = clerkUser.primaryEmailAddress?.emailAddress;
  if (!email) return null;

  const name = clerkUser.fullName ?? email.split("@")[0];

  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.clerkUserId, clerkUser.id))
    .limit(1);

  if (existing.length > 0) return existing[0];

  const [created] = await db
    .insert(schema.users)
    .values({
      clerkUserId: clerkUser.id,
      name,
      email,
      phone: clerkUser.phoneNumbers?.[0]?.phoneNumber ?? null,
      role: "student",
    })
    .returning();

  return created;
}
