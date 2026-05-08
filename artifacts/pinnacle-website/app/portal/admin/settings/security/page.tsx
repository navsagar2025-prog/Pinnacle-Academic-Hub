import { requirePortalRole } from "@/lib/server/portal-auth";
import { Shield } from "lucide-react";
import { SecurityDashboard } from "./SecurityDashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Security — Admin Settings" };

export default async function SecuritySettingsPage() {
  await requirePortalRole("admin");
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
          <Shield size={20} className="text-rose-600" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
            Security
          </h1>
          <p className="text-slate-500 text-sm">
            IP lockouts, failed login attempts, and the security event log.
          </p>
        </div>
      </div>
      <SecurityDashboard />
    </div>
  );
}
