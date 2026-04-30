/*
 * =============================================================================
 * AUTH ABSTRACTION BOUNDARY - READ BEFORE IMPORTING
 * =============================================================================
 *
 * All auth LOGIC (session verification, user identity, role resolution) must
 * go through this file. No other file may call auth() or currentUser() from
 * @clerk/nextjs/server.
 *
 * Complete inventory of permitted direct Clerk imports:
 *
 *   @clerk/nextjs/server (server-side auth logic):
 *     - THIS FILE          : auth(), currentUser() — session & DB user
 *     - middleware.ts      : clerkMiddleware(), createRouteMatcher()
 *
 *   @clerk/nextjs (client-side UI display only — no auth logic):
 *     - app/layout.tsx          : <ClerkProvider> — root auth context
 *     - app/sign-in/page.tsx    : <SignIn> — Clerk-hosted sign-in UI
 *     - app/sign-up/page.tsx    : <SignUp> — Clerk-hosted sign-up UI
 *     - components/layout/Navbar.tsx     : SignedIn/Out/SignInButton/UserButton
 *     - components/portal/PortalShell.tsx: UserButton
 *
 * MIGRATING AWAY FROM CLERK?
 * 1. Replace auth() / currentUser() calls in THIS file with your new provider.
 * 2. Update clerkMiddleware() in middleware.ts.
 * 3. Swap Clerk UI components in Navbar.tsx and PortalShell.tsx.
 * 4. Replace <ClerkProvider> in app/layout.tsx.
 * No other files need changes.
 * =============================================================================
 */

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export type PortalRole = "student" | "parent" | "teacher" | "admin";

const ROLE_PORTAL_MAP: Record<PortalRole, string> = {
  student: "/portal/student",
  parent: "/portal/parent",
  teacher: "/portal/teacher",
  admin: "/portal/admin",
};

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
 * - Unknown roles default to the student portal.
 */
export async function requirePortalRole(requiredRole: PortalRole) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await provisionDbUser();
  if (!user) redirect("/sign-in");

  if (user.role !== requiredRole) {
    const correctPortal = ROLE_PORTAL_MAP[user.role as PortalRole] ?? ROLE_PORTAL_MAP.student;
    redirect(correctPortal);
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

/**
 * Returns the raw Clerk userId for the signed-in session.
 * Use this only when you need the auth identifier but NOT the DB user.
 * Prefer getDbUser() for most cases.
 * Returns null if the user is not authenticated.
 */
export async function authUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId ?? null;
}
