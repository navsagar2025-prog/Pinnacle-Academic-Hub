import { useState, useCallback } from "react";
import { Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function api(method: string, path: string, body: object | null, getToken: () => Promise<string | null>) {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/v1${path}`, {
    method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res.json();
}

type User = { id: string; name: string; email: string; phone: string | null; role: string; clerkUserId: string | null; createdAt: string };
type UsersData = { rows: User[]; total: number };

const ROLES = ["student", "parent", "teacher", "admin"];
const ROLE_COLORS: Record<string, string> = {
  student: "bg-blue-100 text-blue-700", parent: "bg-purple-100 text-purple-700",
  teacher: "bg-teal-100 text-teal-700", admin: "bg-red-100 text-red-700",
};

export function AdminUsers({ getToken }: { getToken: () => Promise<string | null> }) {
  const [users, setUsers] = useState<UsersData | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async (p = page, s = search, r = roleFilter) => {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams({ page: String(p) });
      if (s) params.set("search", s);
      if (r) params.set("role", r);
      const res = await fetch(`${BASE}/api/v1/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json(); setUsers(json.data);
    } finally { setLoading(false); }
  }, [page, search, roleFilter, getToken]);

  const changeRole = async (id: string, role: string) => {
    setUpdatingId(id);
    await api("PATCH", `/admin/users/${id}/role`, { role }, getToken);
    setUpdatingId(null);
    load();
  };

  const doSearch = () => { setPage(1); load(1, search, roleFilter); };

  const totalPages = Math.ceil((users?.total ?? 0) / 50);

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-6">Users</h2>

      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex-1 min-w-[180px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm" placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()} />
        </div>
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); load(1, search, e.target.value); }}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
        <button onClick={doSearch} className="bg-[var(--color-navy)] text-white rounded-lg px-4 py-2 text-sm">Search</button>
        <button onClick={() => load()} className="p-2 text-slate-400 hover:text-slate-700"><RefreshCw size={15} /></button>
      </div>

      {loading && <p className="text-slate-400 text-sm">Loading…</p>}

      {!loading && users && (
        <>
          <p className="text-xs text-slate-500 mb-3">{users.total} users total</p>
          <div className="space-y-2">
            {users.rows.map(u => (
              <div key={u.id} className="card border border-slate-200 flex gap-3 items-center">
                <div className="w-9 h-9 rounded-full bg-[var(--color-navy)]/10 flex items-center justify-center text-[var(--color-navy)] font-bold text-sm shrink-0">
                  {(u.name ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[var(--color-navy)] truncate">{u.name}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email}{u.phone && ` · ${u.phone}`}</p>
                  <p className="text-xs text-slate-400">Joined {new Date(u.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
                <div className="shrink-0">
                  <select
                    value={u.role}
                    disabled={updatingId === u.id}
                    onChange={e => changeRole(u.id, e.target.value)}
                    className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${ROLE_COLORS[u.role] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => { const p = page - 1; setPage(p); load(p); }} disabled={page === 1} className="p-1.5 rounded text-slate-500 disabled:opacity-30"><ChevronLeft size={16} /></button>
              <span className="text-sm text-slate-600">{page} / {totalPages}</span>
              <button onClick={() => { const p = page + 1; setPage(p); load(p); }} disabled={page === totalPages} className="p-1.5 rounded text-slate-500 disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          )}
        </>
      )}

      {!loading && !users && (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm mb-3">Search to load users</p>
          <button onClick={() => load()} className="btn-primary px-4 py-2 text-sm">Load All Users</button>
        </div>
      )}
    </div>
  );
}
