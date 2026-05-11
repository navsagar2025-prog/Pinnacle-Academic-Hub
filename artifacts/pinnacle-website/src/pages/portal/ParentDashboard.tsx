import { useState, useCallback } from "react";
import { useAuth, useUser, useClerk } from "@clerk/react";
import { LayoutDashboard, Bell, CreditCard, LogOut, Menu, AlertCircle } from "lucide-react";
import { useFetch } from "./portalUtils";

type Section = "overview" | "notices" | "fees";
const NAV: { key: Section; label: string; Icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", Icon: LayoutDashboard },
  { key: "notices", label: "Notices", Icon: Bell },
  { key: "fees", label: "Fee Records", Icon: CreditCard },
];

type ChildInfo = { userName: string; userEmail: string; userPhone: string | null; rollNumber: string; batchName: string; batchTiming: string; batchDays: string; courseName: string; enrolledAt: string };
type FeeRecord = { id: string; period: string; amount: number; paidAmount: number; dueDate: string; status: string; paidDate: string | null };
type Notice = { id: string; title: string; body: string; category: string; publishedAt: string };

const FEE_COLOR: Record<string, string> = {
  paid: "bg-green-100 text-green-700", partial: "bg-yellow-100 text-yellow-700",
  due: "bg-red-100 text-red-600", overdue: "bg-red-200 text-red-800", waived: "bg-slate-100 text-slate-600",
};
const CAT_COLOR: Record<string, string> = {
  Academic: "bg-blue-100 text-blue-700", Test: "bg-purple-100 text-purple-700",
  Fee: "bg-red-100 text-red-700", Event: "bg-green-100 text-green-700",
  General: "bg-slate-100 text-slate-600",
};

function NoProfile() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-4"><AlertCircle size={28} /></div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-2">Profile Not Linked Yet</h2>
      <p className="text-slate-500 text-sm max-w-sm">
        Your parent account hasn't been linked to a student record. Please contact the Pinnacle office at{" "}
        <a href="tel:+919971862138" className="text-[var(--color-teal)] font-semibold">+91 99718 62138</a>.
      </p>
    </div>
  );
}

function Overview({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data: childData } = useFetch<{ data: ChildInfo | null }>("/portal/parent/child", getToken);
  const { data: feesData } = useFetch<{ data: FeeRecord[] }>("/portal/parent/fees", getToken);
  const child = childData?.data;
  const fees = feesData?.data ?? [];
  const dueAmount = fees.filter(f => f.status === "due" || f.status === "overdue").reduce((s, f) => s + (f.amount - f.paidAmount), 0);

  if (!child) return <NoProfile />;
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
        <div className="card border border-slate-200">
          <p className="text-xs text-slate-400 mb-1">Batch Timing</p>
          <p className="font-semibold text-[var(--color-navy)] text-sm">{child.batchTiming}</p>
          <p className="text-xs text-slate-500 mt-0.5">{child.batchDays}</p>
        </div>
        <div className={`card border ${dueAmount > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
          <p className="text-xs text-slate-400 mb-1">Fee Due</p>
          <p className={`font-bold text-lg ${dueAmount > 0 ? "text-red-600" : "text-green-600"}`}>
            {dueAmount > 0 ? `₹${dueAmount.toLocaleString("en-IN")}` : "All Clear"}
          </p>
        </div>
      </div>
      <div className="card border border-slate-200">
        <p className="font-semibold text-[var(--color-navy)] text-sm mb-2">Contact Details</p>
        <p className="text-sm text-slate-600">{child.userEmail}</p>
        {child.userPhone && <p className="text-sm text-slate-600 mt-0.5">{child.userPhone}</p>}
        <p className="text-xs text-slate-400 mt-2">Enrolled: {new Date(child.enrolledAt).toLocaleDateString("en-IN")}</p>
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
  const { data, loading } = useFetch<{ data: FeeRecord[] }>("/portal/parent/fees", getToken);
  if (loading) return <div className="text-slate-400 text-sm">Loading…</div>;
  const totalDue = (data?.data ?? []).filter(f => f.status === "due" || f.status === "overdue").reduce((s, f) => s + (f.amount - f.paidAmount), 0);
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-5">Fee Records</h2>
      {totalDue > 0 && (
        <div className="mb-4 card border border-red-200 bg-red-50">
          <p className="text-red-700 font-semibold text-sm">Outstanding: ₹{totalDue.toLocaleString("en-IN")}</p>
          <p className="text-red-500 text-xs mt-0.5">Contact Pinnacle office to clear dues</p>
        </div>
      )}
      <div className="space-y-3">
        {(data?.data ?? []).map(f => (
          <div key={f.id} className="card border border-slate-200 flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-[var(--color-navy)] text-sm">{f.period}</p>
              <p className="text-xs text-slate-500 mt-0.5">Total: ₹{f.amount.toLocaleString("en-IN")} · Paid: ₹{f.paidAmount.toLocaleString("en-IN")}</p>
              <p className="text-xs text-slate-400 mt-0.5">Due: {new Date(f.dueDate).toLocaleDateString("en-IN")}{f.paidDate ? ` · Paid: ${new Date(f.paidDate).toLocaleDateString("en-IN")}` : ""}</p>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${FEE_COLOR[f.status] ?? "bg-slate-100 text-slate-600"}`}>{f.status}</span>
          </div>
        ))}
        {(data?.data ?? []).length === 0 && <p className="text-slate-400 text-sm">No fee records found.</p>}
      </div>
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
        <nav className="flex-1 py-4 space-y-0.5 px-2">
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
          {section === "overview" && <Overview getToken={tokenFn} />}
          {section === "notices" && <NoticesSection getToken={tokenFn} />}
          {section === "fees" && <FeesSection getToken={tokenFn} />}
        </div>
      </div>
    </div>
  );
}
