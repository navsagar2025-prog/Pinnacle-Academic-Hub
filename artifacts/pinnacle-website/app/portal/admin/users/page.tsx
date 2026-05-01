import { db } from "@workspace/db";
import { users } from "@workspace/db/schema";
import { desc, sql } from "drizzle-orm";
import { Users } from "lucide-react";
import { RoleBadge, ChangeRoleButton } from "./UserRoleModal";

export const metadata = { title: "User Management — Admin Panel" };

export default async function AdminUsersPage() {
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)).limit(200),
    db.select({ total: sql<number>`count(*)::int` }).from(users),
  ]);

  const byRole = rows.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">User Management</h1>
        <p className="text-slate-500 text-sm mt-1">{total} registered users</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Students", count: byRole.student ?? 0, color: "border-l-blue-400" },
          { label: "Parents", count: byRole.parent ?? 0, color: "border-l-violet-400" },
          { label: "Teachers", count: byRole.teacher ?? 0, color: "border-l-[var(--color-teal)]" },
          { label: "Admins", count: byRole.admin ?? 0, color: "border-l-[var(--color-maroon)]" },
        ].map((s) => (
          <div key={s.label} className={`card border-l-4 ${s.color}`}>
            <div className="text-2xl font-bold font-[family-name:var(--font-playfair)] text-[var(--color-navy)]">{s.count}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          <p>No users registered yet.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-slate-light)] border-b border-slate-100">
                <tr>
                  {["Name", "Email", "Phone", "Role", "Joined", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--color-slate-light)]/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[var(--color-navy)]/10 flex items-center justify-center text-[var(--color-navy)] text-xs font-bold flex-shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-sm text-[var(--color-navy)] whitespace-nowrap">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{u.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <ChangeRoleButton userId={u.id} currentRole={u.role} userName={u.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 200 && (
            <div className="px-4 py-3 bg-[var(--color-slate-light)] border-t border-slate-100 text-xs text-slate-400 text-center">
              Showing first 200 of {total} users
            </div>
          )}
        </div>
      )}
    </div>
  );
}
