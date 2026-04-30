import { db } from "@workspace/db";
import { auditLogs } from "@workspace/db/schema";
import { desc, sql } from "drizzle-orm";
import { ShieldCheck } from "lucide-react";

export const metadata = { title: "Audit Logs — Admin Panel" };

const ACTION_COLORS: Record<string, string> = {
  "course.create": "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
  "course.update": "bg-blue-100 text-blue-700",
  "course.archive": "bg-slate-100 text-slate-600",
  "fee.create": "bg-[var(--color-gold)]/15 text-[var(--color-navy)]",
  "fee.update": "bg-[var(--color-gold)]/15 text-[var(--color-navy)]",
  "fee.payment": "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
  "fee.waive": "bg-slate-100 text-slate-600",
  "result.create": "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
  "result.update": "bg-blue-100 text-blue-700",
  "result.delete": "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]",
  "blog.create": "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
  "blog.update": "bg-blue-100 text-blue-700",
  "blog.delete": "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]",
  "enquiry.update": "bg-[var(--color-gold)]/15 text-[var(--color-navy)]",
  "settings.update": "bg-purple-100 text-purple-700",
  "admission.update": "bg-blue-100 text-blue-700",
};

export default async function AdminAuditLogsPage() {
  const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200);
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(auditLogs);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[var(--color-navy)]/10 rounded-xl flex items-center justify-center">
          <ShieldCheck size={20} className="text-[var(--color-navy)]" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Audit Logs</h1>
          <p className="text-slate-500 text-sm">{total} events · showing last 200</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <ShieldCheck size={32} className="mx-auto mb-3 opacity-30" />
          <p>No audit events yet. Admin actions will be logged here automatically.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-slate-light)] border-b border-slate-100">
                <tr>
                  {["Time", "Actor", "Action", "Entity", "Details"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--color-slate-light)]/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("en-IN", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{log.actorName ?? "System"}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs font-mono ${ACTION_COLORS[log.action] ?? "bg-slate-100 text-slate-600"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {log.entityType && (
                        <span>
                          <span className="font-medium">{log.entityType}</span>
                          {log.entityId && <span className="text-slate-300"> #{log.entityId.slice(0, 8)}</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono max-w-[200px] truncate">
                      {log.details ? JSON.stringify(log.details) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
