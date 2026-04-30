import { db } from "@workspace/db";
import { siteSettings } from "@workspace/db/schema";
import { Settings } from "lucide-react";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Settings — Admin Panel" };

export default async function AdminSettingsPage() {
  const rows = await db.select().from(siteSettings);
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[var(--color-navy)]/10 rounded-xl flex items-center justify-center">
          <Settings size={20} className="text-[var(--color-navy)]" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Settings</h1>
          <p className="text-slate-500 text-sm">Institute configuration & contact details</p>
        </div>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
