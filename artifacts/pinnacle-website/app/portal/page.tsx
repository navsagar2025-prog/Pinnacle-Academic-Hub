import { redirect } from "next/navigation";
import { getDbUser } from "@/lib/server/portal-auth";

const ROLE_PORTAL_MAP: Record<string, string> = {
  student: "/portal/student",
  parent: "/portal/parent",
  teacher: "/portal/teacher",
  admin: "/portal/admin",
};

/**
 * Post-login redirect handler.
 *
 * Clerk's <SignIn> and <SignUp> components redirect here after authentication.
 * This page resolves the user's role from the database and forwards them to
 * the correct portal, so users never have to know their portal URL upfront.
 *
 * All auth/role logic goes through portal-auth.ts — no Clerk imports here.
 */
export default async function PortalRedirectPage() {
  const user = await getDbUser();

  if (!user) {
    redirect("/sign-in");
  }

  const destination = ROLE_PORTAL_MAP[user.role] ?? "/portal/student";
  redirect(destination);
}
