import { getDbUser } from "@/lib/server/portal-auth";
import { sendTestEmail } from "@/lib/server/email";
import { ok, err } from "@/lib/server/api-response";

export async function POST(request: Request) {
  const dbUser = await getDbUser();
  if (!dbUser) return err("Unauthorized", 401);
  if (dbUser.role !== "admin") return err("Forbidden", 403);

  let body: { to?: string };
  try { body = await request.json(); } catch { return err("Invalid JSON", 400); }

  const to = body.to?.trim() ?? dbUser.email;
  if (!to || !to.includes("@")) return err("Valid email address required", 400);

  const result = await sendTestEmail(to);
  if (!result.ok) return err(`Email failed: ${result.error}`, 502);
  return ok({ sent: true, to });
}
