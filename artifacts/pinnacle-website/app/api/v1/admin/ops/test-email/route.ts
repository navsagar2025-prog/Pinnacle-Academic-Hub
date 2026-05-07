import { getRealAdminUser } from "@/lib/server/portal-auth";
import { ok, err } from "@/lib/server/api-response";
import { sendTestEmail } from "@/lib/server/email";
import { logAudit } from "@/lib/server/audit";

export const runtime = "nodejs";

// Per-process rate limiter: 5 sends per admin per minute (per task spec).
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;
const sendsByAdmin = new Map<string, number[]>();

function checkRate(adminId: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const arr = (sendsByAdmin.get(adminId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_LIMIT) {
    sendsByAdmin.set(adminId, arr);
    return { ok: false, remaining: 0 };
  }
  arr.push(now);
  sendsByAdmin.set(adminId, arr);
  return { ok: true, remaining: RATE_LIMIT - arr.length };
}

export async function POST(request: Request) {
  const actor = await getRealAdminUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden", 403);

  let body: { to?: string };
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body", 400);
  }
  const to = (body.to ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return err("Invalid recipient email", 400);
  }

  const rate = checkRate(actor.id);
  if (!rate.ok) {
    return err("Rate limit reached: max 5 test emails per minute per admin.", 429);
  }

  const result = await sendTestEmail(to);
  await logAudit(actor.id, actor.name, "ops.test_email", "ops", undefined, {
    to,
    ok: result.ok,
    error: result.error ?? null,
  });

  if (!result.ok) {
    return err(result.error ?? "Send failed", 502);
  }
  return ok({ sent: true, to, remaining: rate.remaining });
}
