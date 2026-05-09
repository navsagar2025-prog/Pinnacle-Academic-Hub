import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { users } from "@workspace/db/schema";
import { ne, asc } from "drizzle-orm";
import { ImpersonateClient } from "./ImpersonateClient";
import { readImpersonationContext } from "@/lib/server/impersonation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Impersonate — Operations" };

export default async function ImpersonatePage() {
  await requirePortalRole("admin");
  const all = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(ne(users.role, "admin"))
    .orderBy(asc(users.name))
    .limit(500);
  const active = await readImpersonationContext();
  return (
    <ImpersonateClient
      users={all}
      activeSession={
        active
          ? {
              targetName: active.targetName ?? "user",
              targetUserId: active.targetUserId,
              expiresAt: active.expiresAt.toISOString(),
            }
          : null
      }
    />
  );
}
