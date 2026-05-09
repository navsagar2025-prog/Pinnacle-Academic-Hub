"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

const ROLES = [
  { value: "student", label: "Student", color: "bg-blue-100 text-blue-700" },
  { value: "parent", label: "Parent", color: "bg-violet-100 text-violet-700" },
  { value: "teacher", label: "Teacher", color: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]" },
  { value: "admin", label: "Admin", color: "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]" },
];

export function RoleBadge({ role }: { role: string }) {
  const r = ROLES.find((x) => x.value === role);
  return (
    <span className={`badge text-xs ${r?.color ?? "bg-slate-100 text-slate-500"}`}>
      {r?.label ?? role}
    </span>
  );
}

export function ChangeRoleButton({ userId, currentRole, userName }: { userId: string; currentRole: string; userName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(currentRole);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (role === currentRole) { setOpen(false); return; }
    setSaving(true);
    setError("");
    const res = await fetch(`${BASE}/api/v1/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Failed to update role");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-[var(--color-teal)] hover:underline flex items-center gap-1"
      >
        <ShieldCheck size={12} /> Change Role
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-[var(--color-maroon)]">{error}</span>}
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="text-xs border border-[var(--color-teal)] rounded-md px-2 py-1 focus:outline-none"
        autoFocus
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      <button onClick={save} disabled={saving} className="text-xs bg-[var(--color-teal)] text-white px-2.5 py-1 rounded-md disabled:opacity-50">
        {saving ? "…" : "Save"}
      </button>
      <button onClick={() => { setRole(currentRole); setOpen(false); }} className="text-xs text-slate-400 hover:text-slate-600">✕</button>
    </div>
  );
}
