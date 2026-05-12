import { useState, useCallback } from "react";
import { useAuth, useUser, useClerk } from "@clerk/react";
import {
  LayoutDashboard, Bell, CreditCard, LogOut, Menu,
  AlertCircle, ClipboardList, BookOpen, Trophy, Download,
} from "lucide-react";
import { useFetch } from "./portalUtils";

type Section = "overview" | "attendance" | "assignments" | "results" | "notices" | "fees";

const NAV: { key: Section; label: string; Icon: React.ElementType }[] = [
  { key: "overview",    label: "Overview",    Icon: LayoutDashboard },
  { key: "attendance",  label: "Attendance",  Icon: ClipboardList   },
  { key: "assignments", label: "Assignments", Icon: BookOpen        },
  { key: "results",     label: "Results",     Icon: Trophy          },
  { key: "notices",     label: "Notices",     Icon: Bell            },
  { key: "fees",        label: "Fee Records", Icon: CreditCard      },
];

type ChildInfo = {
  id: string; userName: string; userEmail: string; userPhone: string | null;
  rollNumber: string; batchId: string | null;
  batchName: string; batchTiming: string; batchDays: string; courseName: string; enrolledAt: string;
};
type AttendanceRecord = { id: string; date: string; subject: string; status: string; note: string | null };
type AttendanceStats = { present: number; total: number; pct: number };
type Assignment = { id: string; title: string; subject: string; dueDate: string; maxMarks: number | null };
type FeeRecord = { id: string; period: string; amount: number; paidAmount: number; dueDate: string; status: string; paidDate: string | null; paymentMethod: string | null; transactionRef: string | null };
type TestResult = { id: string; examName: string; subject: string; totalMarks: number; marksObtained: number; rank: string | null; examDate: string };
type Notice = { id: string; title: string; body: string; category: string; publishedAt: string };

type Overview = {
  child: ChildInfo | null;
  attendance: { stats: AttendanceStats; recent: AttendanceRecord[] };
  assignments: Assignment[];
  fees: { records: FeeRecord[]; totalDue: number };
  results: TestResult[];
};

const FEE_COLOR: Record<string, string> = {
  paid: "bg-green-100 text-green-700", partial: "bg-yellow-100 text-yellow-700",
  due: "bg-red-100 text-red-600", overdue: "bg-red-200 text-red-800", waived: "bg-slate-100 text-slate-600",
};
const CAT_COLOR: Record<string, string> = {
  Academic: "bg-blue-100 text-blue-700", Test: "bg-purple-100 text-purple-700",
  Fee: "bg-red-100 text-red-700", Event: "bg-green-100 text-green-700",
  General: "bg-slate-100 text-slate-600",
};
const ATT_COLOR: Record<string, string> = {
  present: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-700",
  late: "bg-yellow-100 text-yellow-700",
};

function NoProfile() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
        <AlertCircle size={28} />
      </div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-2">Profile Not Linked Yet</h2>
      <p className="text-slate-500 text-sm max-w-sm">
        Your parent account hasn't been linked to a student record. Please contact the Pinnacle office at{" "}
        <a href="tel:+919971862138" className="text-[var(--color-teal)] font-semibold">+91 99718 62138</a>.
      </p>
    </div>
  );
}

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`card border ${highlight ? "border-red-200 bg-red-50" : "border-slate-200"}`}>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`font-bold text-lg leading-tight ${highlight ? "text-red-600" : "text-[var(--color-navy)]"}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function AttendanceRing({ pct }: { pct: number }) {
  const r = 36; const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 75 ? "#16a34a" : pct >= 60 ? "#d97706" : "#dc2626";
  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx="44" cy="44" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 44 44)" />
      <text x="44" y="48" textAnchor="middle" fontSize="14" fontWeight="700" fill={color}>{pct}%</text>
    </svg>
  );
}

function OverviewSection({ overview }: { overview: Overview }) {
  const { child, attendance, fees, results, assignments } = overview;
  if (!child) return <NoProfile />;
  const dueCount = assignments.filter(a => new Date(a.dueDate) >= new Date()).length;
  const overdueCount = assignments.filter(a => new Date(a.dueDate) < new Date()).length;
  return (
    <div>
      <div className="card border border-slate-200 mb-6 bg-gradient-to-br from-[#0a5c3c] to-[#0d7060] text-white">
        <p className="text-white/60 text-sm mb-1">Your Child</p>
        <h2 className="text-2xl font-bold font-[family-name:var(--font-playfair)]">{child.userName}</h2>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <span className="bg-white/10 rounded-full px-3 py-1">🎓 {child.courseName}</span>
          <span className="bg-white/10 rounded-full px-3 py-1">📋 {child.batchName}</span>
          <span className="bg-white/10 rounded-full px-3 py-1">🆔 Roll: {child.rollNumber}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard label="Batch Timing" value={child.batchTiming} sub={child.batchDays} />
        <StatCard
          label="Fee Due"
          value={fees.totalDue > 0 ? `₹${fees.totalDue.toLocaleString("en-IN")}` : "All Clear"}
          highlight={fees.totalDue > 0}
        />
        <StatCard label="Attendance" value={`${attendance.stats.pct}%`} sub={`${attendance.stats.present}/${attendance.stats.total} classes`} highlight={attendance.stats.pct < 75 && attendance.stats.total > 0} />
        <StatCard label="Assignments" value={String(dueCount + overdueCount)} sub={overdueCount > 0 ? `${overdueCount} overdue` : "all on track"} highlight={overdueCount > 0} />
      </div>

      {results.length > 0 && (
        <div className="card border border-slate-200">
          <p className="font-semibold text-[var(--color-navy)] text-sm mb-3">Recent Results</p>
          <div className="space-y-2">
            {results.slice(0, 3).map(r => {
              const pct = Math.round(r.marksObtained / r.totalMarks * 100);
              return (
                <div key={r.id} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-navy)]">{r.examName}</p>
                    <p className="text-xs text-slate-400">{r.subject} · {new Date(r.examDate).toLocaleDateString("en-IN")}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pct >= 75 ? "bg-green-100 text-green-700" : pct >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                    {r.marksObtained}/{r.totalMarks}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AttendanceSection({ overview }: { overview: Overview }) {
  const { stats, recent } = overview.attendance;
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-5">Attendance</h2>
      <div className="card border border-slate-200 mb-5 flex items-center gap-6">
        <AttendanceRing pct={stats.pct} />
        <div>
          <p className="text-2xl font-bold text-[var(--color-navy)]">{stats.pct}%</p>
          <p className="text-sm text-slate-500">{stats.present} present out of {stats.total} classes</p>
          {stats.pct < 75 && stats.total > 0 && (
            <p className="text-xs text-red-600 font-semibold mt-1">⚠ Below 75% threshold</p>
          )}
        </div>
      </div>
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Recent Records</h3>
      <div className="space-y-2">
        {recent.length === 0 && <p className="text-slate-400 text-sm">No attendance records yet.</p>}
        {recent.map(r => (
          <div key={r.id} className="card border border-slate-200 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-[var(--color-navy)]">{r.subject}</p>
              <p className="text-xs text-slate-400">{new Date(r.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</p>
              {r.note && <p className="text-xs text-slate-500 mt-0.5 italic">{r.note}</p>}
            </div>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${ATT_COLOR[r.status] ?? "bg-slate-100 text-slate-600"}`}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssignmentsSection({ overview }: { overview: Overview }) {
  const now = new Date();
  const { assignments } = overview;
  const sorted = [...assignments].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-5">Assignments</h2>
      {sorted.length === 0 && <p className="text-slate-400 text-sm">No upcoming assignments at this time.</p>}
      <div className="space-y-3">
        {sorted.map(a => {
          const due = new Date(a.dueDate);
          const isOverdue = due < now;
          const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return (
            <div key={a.id} className={`card border ${isOverdue ? "border-red-200 bg-red-50" : "border-slate-200"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--color-navy)] text-sm">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{a.subject}{a.maxMarks ? ` · ${a.maxMarks} marks` : ""}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Due: {due.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${isOverdue ? "bg-red-100 text-red-700" : daysLeft <= 2 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                  {isOverdue ? "Overdue" : daysLeft === 0 ? "Due today" : `${daysLeft}d left`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultsSection({ overview }: { overview: Overview }) {
  const { results } = overview;
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-5">Test Results</h2>
      {results.length === 0 && <p className="text-slate-400 text-sm">No test results recorded yet.</p>}
      <div className="space-y-3">
        {results.map(r => {
          const pct = Math.round(r.marksObtained / r.totalMarks * 100);
          return (
            <div key={r.id} className="card border border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--color-navy)] text-sm truncate">{r.examName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{r.subject}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(r.examDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold text-base ${pct >= 75 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                    {r.marksObtained}<span className="text-slate-400 font-normal text-sm">/{r.totalMarks}</span>
                  </p>
                  <p className="text-xs text-slate-500">{pct}%</p>
                  {r.rank && <p className="text-xs text-slate-400 mt-0.5">Rank: {r.rank}</p>}
                </div>
              </div>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NoticesSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading } = useFetch<{ data: Notice[] }>("/portal/parent/notices", getToken);
  if (loading) return <div className="text-slate-400 text-sm">Loading…</div>;
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-5">Notices</h2>
      <div className="space-y-3">
        {(data?.data ?? []).map(n => (
          <div key={n.id} className="card border border-slate-200">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLOR[n.category] ?? "bg-slate-100 text-slate-600"}`}>{n.category}</span>
              <span className="text-xs text-slate-400">{new Date(n.publishedAt).toLocaleDateString("en-IN")}</span>
            </div>
            <p className="font-semibold text-[var(--color-navy)] text-sm">{n.title}</p>
            <p className="text-slate-500 text-sm mt-1">{n.body}</p>
          </div>
        ))}
        {(data?.data ?? []).length === 0 && <p className="text-slate-400 text-sm">No notices at this time.</p>}
      </div>
    </div>
  );
}

function FeesSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading } = useFetch<{ data: FeeRecord[]; summary: { totalFee: number; totalPaid: number; totalDue: number; nextDue: string | null } }>("/portal/fees", getToken);
  const [downloading, setDownloading] = useState<string | null>(null);

  const records = data?.data ?? [];
  const summary = data?.summary;
  const totalFee = summary?.totalFee ?? 0;
  const totalPaid = summary?.totalPaid ?? 0;
  const totalDue = summary?.totalDue ?? 0;
  const nextDue = summary?.nextDue ?? null;

  const downloadReceipt = async (feeId: string) => {
    setDownloading(feeId);
    try {
      const token = await getToken();
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/v1/portal/fees/receipt/${feeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      alert("Could not download receipt. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <div className="text-slate-400 text-sm">Loading…</div>;
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-5">Fee Records</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card border border-slate-200 text-center">
          <p className="text-xs text-slate-400 mb-1">Total Fee</p>
          <p className="text-lg font-bold text-[var(--color-navy)]">₹{totalFee.toLocaleString("en-IN")}</p>
        </div>
        <div className="card border border-slate-200 text-center">
          <p className="text-xs text-slate-400 mb-1">Total Paid</p>
          <p className="text-lg font-bold text-green-600">₹{totalPaid.toLocaleString("en-IN")}</p>
        </div>
        <div className={`card border text-center ${totalDue > 0 ? "border-red-200 bg-red-50" : "border-slate-200"}`}>
          <p className="text-xs text-slate-400 mb-1">Amount Due</p>
          <p className={`text-lg font-bold ${totalDue > 0 ? "text-red-600" : "text-green-600"}`}>
            {totalDue > 0 ? `₹${totalDue.toLocaleString("en-IN")}` : "Nil"}
          </p>
        </div>
        <div className="card border border-slate-200 text-center">
          <p className="text-xs text-slate-400 mb-1">Next Due Date</p>
          <p className="text-sm font-bold text-[var(--color-navy)]">
            {nextDue ? new Date(nextDue).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
          </p>
        </div>
      </div>
      {totalDue > 0 && (
        <div className="mb-4 flex items-center gap-2 text-sm bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          <AlertCircle size={16} /> Outstanding ₹{totalDue.toLocaleString("en-IN")} — contact Pinnacle office to clear dues
        </div>
      )}
      <div className="space-y-3">
        {records.map(f => (
          <div key={f.id} className="card border border-slate-200">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--color-navy)] text-sm">{f.period}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total: ₹{f.amount.toLocaleString("en-IN")} · Paid: ₹{f.paidAmount.toLocaleString("en-IN")}
                  {f.amount - f.paidAmount > 0 ? ` · Due: ₹${(f.amount - f.paidAmount).toLocaleString("en-IN")}` : ""}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Due: {new Date(f.dueDate).toLocaleDateString("en-IN")}
                  {f.paidDate ? ` · Paid on: ${new Date(f.paidDate).toLocaleDateString("en-IN")}` : ""}
                  {f.paymentMethod ? ` · Mode: ${f.paymentMethod}` : ""}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${FEE_COLOR[f.status] ?? "bg-slate-100 text-slate-600"}`}>
                  {f.status}
                </span>
                {(f.status === "paid" || f.status === "partial") && (
                  <button
                    onClick={() => downloadReceipt(f.id)}
                    disabled={downloading === f.id}
                    className="flex items-center gap-1 text-xs text-[#0a5c3c] font-medium hover:underline disabled:opacity-50"
                  >
                    <Download size={12} />
                    {downloading === f.id ? "Opening…" : "Open Receipt"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {records.length === 0 && <p className="text-slate-400 text-sm">No fee records found.</p>}
      </div>
    </div>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
        <AlertCircle size={28} />
      </div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-2">Couldn't Load Dashboard</h2>
      <p className="text-slate-500 text-sm max-w-sm mb-4">
        Something went wrong while fetching your child's data. Please check your connection and try again.
      </p>
      <button onClick={onRetry} className="px-4 py-2 rounded-lg bg-[#0a5c3c] text-white text-sm font-medium hover:bg-[#0d7060] transition-colors">
        Retry
      </button>
    </div>
  );
}

export default function ParentDashboard() {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const [section, setSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const tokenFn = useCallback(() => getToken(), [getToken]);

  const { data: overviewRes, loading, error, reload } = useFetch<{ data: Overview | null }>("/portal/parent/overview", tokenFn);
  const overview = overviewRes?.data;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex bg-[var(--color-slate-light)]">
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-[#0a5c3c] flex flex-col transition-transform duration-300 top-0 lg:static lg:translate-x-0 lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white font-bold text-sm">P</div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Parent Portal</p>
              <p className="text-white/40 text-xs truncate max-w-[120px]">{clerkUser?.firstName ?? "Parent"}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
          {NAV.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => { setSection(key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${section === key ? "bg-white/15 text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}>
              <Icon size={16} />{label}
            </button>
          ))}
        </nav>
        <div className="px-2 pb-4">
          <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 min-w-0">
        <div className="lg:hidden flex items-center gap-3 bg-[#0a5c3c] px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="text-white"><Menu size={20} /></button>
          <p className="text-white font-semibold text-sm">{NAV.find(n => n.key === section)?.label}</p>
        </div>
        <div className="p-6 max-w-4xl">
          {loading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="animate-pulse rounded-xl bg-slate-100 h-20" />)}
            </div>
          )}
          {!loading && error && section !== "notices" && <LoadError onRetry={reload} />}
          {!loading && !error && !overview && section !== "notices" && <NoProfile />}
          {!loading && !error && overview && section === "overview"    && <OverviewSection    overview={overview} />}
          {!loading && !error && overview && section === "attendance"  && <AttendanceSection  overview={overview} />}
          {!loading && !error && overview && section === "assignments" && <AssignmentsSection overview={overview} />}
          {!loading && !error && overview && section === "results"     && <ResultsSection     overview={overview} />}
          {section === "fees" && <FeesSection getToken={tokenFn} />}
          {section === "notices" && <NoticesSection getToken={tokenFn} />}
        </div>
      </div>
    </div>
  );
}
