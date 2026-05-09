import { redirect } from "next/navigation";

/**
 * /portal/admin/system-health  →  canonical path at /portal/admin/ops/health
 * Keeps old bookmarks / linked references working.
 */
export default function SystemHealthRedirect() {
  redirect("/portal/admin/ops/health");
}
