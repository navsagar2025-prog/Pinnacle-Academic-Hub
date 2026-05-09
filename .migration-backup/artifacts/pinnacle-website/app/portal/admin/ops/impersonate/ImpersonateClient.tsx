"use client";

import { useMemo, useState } from "react";
import { UserCog, Search, Play, StopCircle, AlertCircle } from "lucide-react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
}

const ROLE_BADGE: Record<string, string> = {
  student: "bg-blue-100 text-blue-700",
  parent: "bg-purple-100 text-purple-700",
  teacher: "bg-emerald-100 text-emerald-700",
};

export function ImpersonateClient({
  users,
  activeSession,
}: {
  users: UserRow[];
  activeSession: { targetName: string; targetUserId: string; expiresAt: string } | null;
}) {
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (!needle) return true;
      return u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle);
    }).slice(0, 200);
  }, [users, q, roleFilter]);

  async function start(targetUserId: string) {
    if (!confirm("Begin impersonating this user? Every action will be audited.")) return;
    setBusyId(targetUserId);
    setError(null);
    try {
      const res = await fetch("/pinnacle-website/api/v1/admin/ops/impersonate/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Could not start impersonation");
        return;
      }
      // Redirect to the user's portal so the admin sees what they see.
      const role = json.data.target.role;
      window.location.href = `/pinnacle-website/portal/${role}`;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function stop() {
    setBusyId("__stop__");
    try {
      await fetch("/pinnacle-website/api/v1/admin/ops/impersonate/stop", { method: "POST" });
      window.location.reload();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[var(--color-navy)]/10 rounded-xl flex items-center justify-center">
          <UserCog size={20} className="text-[var(--color-navy)]" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Impersonate</h1>
          <p className="text-slate-500 text-sm">
            Temporarily browse the site as another user. Sessions auto-end after 60 minutes; every action is recorded.
          </p>
        </div>
      </div>

      {activeSession && (
        <div className="card border-amber-300 bg-amber-50 p-4 flex flex-wrap items-center gap-3">
          <AlertCircle size={18} className="text-amber-700" />
          <div className="flex-1 min-w-[200px]">
            <div className="font-semibold text-amber-900">Currently impersonating: {activeSession.targetName}</div>
            <div className="text-xs text-amber-800/80">
              Auto-ends at {new Date(activeSession.expiresAt).toLocaleString("en-IN")}
            </div>
          </div>
          <button onClick={stop} disabled={busyId === "__stop__"} className="btn btn-primary inline-flex items-center gap-2">
            <StopCircle size={14} /> Stop
          </button>
        </div>
      )}

      {error && (
        <div className="card border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div className="card p-4 space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or email…"
              className="w-full rounded-md border border-slate-200 pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All roles</option>
            <option value="student">Students</option>
            <option value="parent">Parents</option>
            <option value="teacher">Teachers</option>
          </select>
        </div>

        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="text-left py-2">User</th>
              <th className="text-left py-2">Email</th>
              <th className="text-left py-2">Role</th>
              <th className="text-right py-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((u) => (
              <tr key={u.id}>
                <td className="py-2">{u.name}</td>
                <td className="py-2 text-slate-500 text-xs">{u.email}</td>
                <td className="py-2">
                  <span className={`text-xs font-semibold rounded-full px-2 py-0.5 capitalize ${ROLE_BADGE[u.role] ?? "bg-slate-100 text-slate-600"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => start(u.id)}
                    disabled={!!busyId || !!activeSession}
                    className="btn btn-secondary inline-flex items-center gap-1 text-xs disabled:opacity-50"
                  >
                    <Play size={12} /> Impersonate
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">No users match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
