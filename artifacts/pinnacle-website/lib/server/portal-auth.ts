import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export type PortalRole = "student" | "parent" | "teacher" | "admin";

/**
 * Upserts a DB user record from Clerk user data.
 * - Creates a new record with role="student" on first sign-in.
 * - If Clerk publicMetadata.role is set, syncs it to the DB role.
 * - Updates name/email if changed in Clerk.
 * Returns the up-to-date DB user.
 */
async function provisionDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.primaryEmailAddress?.emailAddress;
  if (!email) return null;

  const name = clerkUser.fullName ?? email.split("@")[0];
  const phone = clerkUser.phoneNumbers?.[0]?.phoneNumber ?? null;
  const clerkRole = (clerkUser.publicMetadata?.role as PortalRole | undefined) ?? null;

  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.clerkUserId, userId))
    .limit(1);

  if (existing) {
    const needsUpdate =
      existing.name !== name ||
      existing.email !== email ||
      (clerkRole && existing.role !== clerkRole);

    if (needsUpdate) {
      const [updated] = await db
        .update(schema.users)
        .set({
          name,
          email,
          ...(phone ? { phone } : {}),
          ...(clerkRole ? { role: clerkRole } : {}),
          updatedAt: new Date(),
        })
        .where(eq(schema.users.clerkUserId, userId))
        .returning();
      return updated;
    }
    return existing;
  }

  const [created] = await db
    .insert(schema.users)
    .values({
      clerkUserId: userId,
      name,
      email,
      phone,
      role: clerkRole ?? "student",
    })
    .returning();

  return created;
}

/**
 * Server-side utility: verifies the signed-in user has the required role.
 * - Creates/upserts the DB user record on first access.
 * - Syncs role from Clerk publicMetadata if set.
 * - Redirects to /sign-in if not authenticated.
 * - Redirects to the user's correct portal if they have a different role.
 */
export async function requirePortalRole(requiredRole: PortalRole) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await provisionDbUser();
  if (!user) redirect("/sign-in");

  if (user.role !== requiredRole) {
    const rolePortalMap: Record<string, string> = {
      student: "/portal/student",
      parent: "/portal/parent",
      teacher: "/portal/teacher",
      admin: "/portal/admin",
    };
    const correctPortal = rolePortalMap[user.role];
    redirect(correctPortal ?? "/sign-in");
  }

  return user;
}

/**
 * Resolves the DB user for any authenticated Clerk user.
 * Creates the record if it doesn't exist yet (auto-provision).
 * Does NOT enforce role — use requirePortalRole for that.
 */
export async function getDbUser() {
  const user = await provisionDbUser();
  return user ?? null;
}

/**
 * Legacy helper: kept for backward compatibility with API routes
 * that call getDbUser with a clerkUserId string directly.
 */
export async function getDbUserById(clerkUserId: string) {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.clerkUserId, clerkUserId))
    .limit(1);
  return user ?? null;
}
