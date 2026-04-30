import { ok } from "@/lib/server/api-response";

export async function GET() {
  return ok({
    status: "ok",
    version: "1.0.0",
    service: "Pinnacle Academic Classes API",
    timestamp: new Date().toISOString(),
  });
}
