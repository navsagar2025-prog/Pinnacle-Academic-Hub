import { useState, useCallback, useEffect } from "react";
import { Search, RefreshCw, ChevronLeft, ChevronRight, UserPlus, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast, SkeletonList, useDebounce, apiMutation, useModalEscape } from "./portalUtils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type User = {
  id: string; name: string; email: string; phone: string | null;
  role: string; clerkUserId: string; approvalStatus: string; createdAt: string;
};
type UsersData = { rows: User[]; total: number };

const ROLES = ["student", "parent", "teacher", "admin"];
const ROLE_COLORS: Record<string, string> = {
  student: "bg-blue-100 text-blue-700", parent: "bg-purple-100 text-purple-700",
  teacher: "bg-teal-100 text-teal-700", admin: "bg-red-100 text-red-700",
};
const STATUS_COLORS: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-600",
};
const STATUS_ICONS: Record<string, React.ReactNode> = {
  approved: <CheckCircle size={11} />,
  pending: <Clock size={11} />,
  rejected: <XCircle size={11} />,
};

type AddUserForm = { name: string; email: string; phone: string; role: string };
const EMPTY_FORM: AddUserForm = { name: "", email: "", phone: "", role: "student" };

export function AdminUsers({ getToken }: { getToken: () => Promise<string | null> }) {
  const { toast } = useToast();
  const [users, setUsers] = useState<UsersData | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Add User modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<AddUserForm>(EMPTY_FORM);
  const [addSaving, setAddSaving] = useState(false);

  // Confirm modal (approve / reject / create)
  const [confirm, setConfirm] = useState<{ type: "approve" | "reject" | "create"; userId?: string; label?: string } | null>(null);

  useModalEscape(() => { setShowAdd(false); setConfirm(null); }, showAdd || !!confirm);

  const debouncedSearch = useDebounce(search, 350);

  const load = useCallback(async (p = page, s = debouncedSearch, r = roleFilter, st = statusFilter) => {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams({ page: String(p) });
      if (s) params.set("search", s);
      if (r) params.set("role", r);
      if (st) params.set("status", st);
      const res = await fetch(`${BASE}/api/v1/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setUsers(json.data);
    } catch { toast("error", "Failed to load users"); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, roleFilter, statusFilter, getToken]);

  useEffect(() => {
    if (debouncedSearch.length === 0 || debouncedSearch.length >= 2) {
      setPage(1); load(1, debouncedSearch, roleFilter, statusFilter);
    }
  }, [debouncedSearch]);

  const changeRole = async (id: string, role: string) => {
    setUpdatingId(id);
    const res = await apiMutation("PATCH", `/admin/users/${id}/role`, { role }, getToken);
    if (res.ok) toast("success", `Role updated to ${role}`);
    else toast("error", "Role update failed");
    setUpdatingId(null); load();
  };

  const approveUser = async (id: string) => {
    setUpdatingId(id);
    const res = await apiMutation("PATCH", `/admin/users/${id}/approve`, {}, getToken);
    if (res.ok) { toast("success", "User approved"); load(); }
    else toast("error", "Approval failed");
    setUpdatingId(null); setConfirm(null);
  };

  const rejectUser = async (id: string) => {
    setUpdatingId(id);
    const res = await apiMutation("PATCH", `/admin/users/${id}/reject`, {}, getToken);
    if (res.ok) { toast("success", "User rejected"); load(); }
    else toast("error", "Rejection failed");
    setUpdatingId(null); setConfirm(null);
  };

  const createUser = async () => {
    if (!addForm.name.trim() || !addForm.email.trim()) {
      toast("error", "Name and email are required"); return;
    }
    setAddSaving(true);
    const res = await apiMutation("POST", "/admin/users", addForm, getToken);
    if (res.ok) {
      toast("success", `User ${addForm.name} created and approved`);
      setShowAdd(false); setAddForm(EMPTY_FORM); setConfirm(null); load();
    } else {
      const msg = res.data?.error ?? "Failed to create user";
      toast("error", msg);
    }
    setAddSaving(false);
  };

  const totalPages = Math.ceil((users?.total ?? 0) / 50);
  const pendingCount = users?.rows.filter(u => u.approvalStatus === "pending").length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-navy)]">Users</h2>
          {pendingCount > 0 && (
            <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
              <Clock size={11} /> {pendingCount} pending approval on this page
            </p>
          )}
        </div>
        <button
          onClick={() => { setShowAdd(true); setAddForm(EMPTY_FORM); }}
          className="btn-primary flex items-center gap-1.5 px-3 py-2 text-sm"
        >
          <UserPlus size={15} /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex-1 min-w-[180px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm"
            placeholder="Search name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); load(1, debouncedSearch, e.target.value, statusFilter); }}
        >
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
        <select
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); load(1, debouncedSearch, roleFilter, e.target.value); }}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={() => load()} className="p-2 text-slate-400 hover:text-slate-700">
          <RefreshCw size={15} />
        </button>
      </div>

      {loading && <SkeletonList rows={6} />}

      {!loading && users && (
        <>
          <p className="text-xs text-slate-500 mb-3">{users.total} users total</p>
          <div className="space-y-2">
            {users.rows.map(u => (
              <div
                key={u.id}
                className={`card border flex gap-3 items-center ${u.approvalStatus === "pending" ? "border-amber-200 bg-amber-50/40" : "border-slate-200"}`}
              >
                <div className="w-9 h-9 rounded-full bg-[var(--color-navy)]/10 flex items-center justify-center text-[var(--color-navy)] font-bold text-sm shrink-0">
                  {(u.name ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-[var(--color-navy)] truncate">{u.name}</p>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[u.approvalStatus] ?? "bg-slate-100 text-slate-500"}`}>
                      {STATUS_ICONS[u.approvalStatus]}
                      {u.approvalStatus === "pending" ? "Pending Approval"
                        : u.approvalStatus === "rejected" ? "Rejected"
                        : "Approved"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{u.email}{u.phone && ` · ${u.phone}`}</p>
                  <p className="text-xs text-slate-400">Joined {new Date(u.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {u.approvalStatus === "pending" && (
                    <>
                      <button
                        onClick={() => setConfirm({ type: "approve", userId: u.id, label: u.name })}
                        disabled={updatingId === u.id}
                        className="flex items-center gap-1 text-xs bg-green-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle size={12} /> Approve
                      </button>
                      <button
                        onClick={() => setConfirm({ type: "reject", userId: u.id, label: u.name })}
                        disabled={updatingId === u.id}
                        className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2.5 py-1.5 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </>
                  )}
                  {u.approvalStatus === "rejected" && (
                    <button
                      onClick={() => setConfirm({ type: "approve", userId: u.id, label: u.name })}
                      disabled={updatingId === u.id}
                      className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle size={12} /> Re-approve
                    </button>
                  )}
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
          <p className="text-slate-400 text-sm mb-3">Search to load users or click below</p>
          <button onClick={() => load()} className="btn-primary px-4 py-2 text-sm">Load All Users</button>
        </div>
      )}

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="font-bold text-[var(--color-navy)] text-lg mb-1">Add New User</h3>
              <p className="text-slate-500 text-sm mb-5">
                Admin-created users are automatically approved. If the user already has a Pinnacle account with this email, their accounts will be linked on next login.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g. Arjun Sharma"
                    value={addForm.name}
                    onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email Address <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="arjun@example.com"
                    value={addForm.email}
                    onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="+91 98765 43210"
                    value={addForm.phone}
                    onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    value={addForm.role}
                    onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 px-6 py-4 flex gap-3 justify-end">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
              <button
                onClick={() => setConfirm({ type: "create" })}
                disabled={addSaving || !addForm.name.trim() || !addForm.email.trim()}
                className="btn-primary px-5 py-2 text-sm disabled:opacity-50"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            {confirm.type === "approve" && (
              <>
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><CheckCircle size={28} className="text-green-600" /></div>
                <h3 className="font-bold text-[var(--color-navy)] mb-2">Approve User?</h3>
                <p className="text-slate-500 text-sm mb-5"><strong>{confirm.label}</strong> will be able to log into their portal.</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setConfirm(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
                  <button onClick={() => approveUser(confirm.userId!)} disabled={!!updatingId} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">Approve</button>
                </div>
              </>
            )}
            {confirm.type === "reject" && (
              <>
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><XCircle size={28} className="text-red-600" /></div>
                <h3 className="font-bold text-[var(--color-navy)] mb-2">Reject User?</h3>
                <p className="text-slate-500 text-sm mb-5"><strong>{confirm.label}</strong> will see a "Not Approved" screen when they try to log in.</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setConfirm(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
                  <button onClick={() => rejectUser(confirm.userId!)} disabled={!!updatingId} className="bg-red-600 text-white px-5 py-2 text-sm rounded-lg hover:bg-red-700 disabled:opacity-50">Reject</button>
                </div>
              </>
            )}
            {confirm.type === "create" && (
              <>
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4"><UserPlus size={28} className="text-blue-600" /></div>
                <h3 className="font-bold text-[var(--color-navy)] mb-2">Create User?</h3>
                <p className="text-slate-500 text-sm mb-1">
                  <strong>{addForm.name}</strong> ({addForm.email})
                </p>
                <p className="text-slate-500 text-sm mb-5">Role: <strong>{addForm.role}</strong> · Status: <span className="text-green-600 font-medium">Auto-approved</span></p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setConfirm(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Back</button>
                  <button onClick={createUser} disabled={addSaving} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">
                    {addSaving ? "Creating…" : "Confirm & Create"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
