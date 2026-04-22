import { PortalLayout } from "@/components/layout/PortalLayout";
import { adminNavItems } from "./Dashboard";
import { IndianRupee, TrendingUp, AlertCircle, CheckCircle2, Clock, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

const summary = [
  { label: "Total Billed (Apr)",     value: "₹22,50,000", icon: IndianRupee,   color: "text-primary" },
  { label: "Collected",              value: "₹18,40,000", icon: CheckCircle2,  color: "text-green-600" },
  { label: "Pending",                value: "₹2,70,000",  icon: Clock,         color: "text-yellow-600" },
  { label: "Overdue (>30 days)",     value: "₹1,40,000",  icon: AlertCircle,   color: "text-destructive" },
];

const records = [
  { name: "Arjun Mehta",      rollNo: "JEE26-047", batch: "JEE 2026", amount: "₹40,000", dueDate: "01 Apr 2026", paidOn: "28 Mar 2026", status: "Paid" },
  { name: "Riya Kapoor",      rollNo: "NEE26-012", batch: "NEET 2026",amount: "₹42,500", dueDate: "01 Apr 2026", paidOn: "02 Apr 2026", status: "Paid" },
  { name: "Siddharth Roy",    rollNo: "C12-019",   batch: "Cl-12 PCM",amount: "₹20,000", dueDate: "01 Apr 2026", paidOn: "—",           status: "Pending" },
  { name: "Karan Sharma",     rollNo: "JEE26-051", batch: "JEE 2026", amount: "₹40,000", dueDate: "01 Mar 2026", paidOn: "—",           status: "Overdue" },
  { name: "Ananya Patel",     rollNo: "NEE26-028", batch: "NEET 2026",amount: "₹42,500", dueDate: "01 Apr 2026", paidOn: "01 Apr 2026", status: "Paid" },
  { name: "Pooja Singh",      rollNo: "FND-056",   batch: "Foundation",amount: "₹15,000", dueDate: "01 Apr 2026", paidOn: "—",          status: "Pending" },
  { name: "Divya Joshi",      rollNo: "NEE26-041", batch: "NEET 2026",amount: "₹42,500", dueDate: "01 Feb 2026", paidOn: "—",           status: "Overdue" },
  { name: "Amit Srivastava",  rollNo: "JEE26-039", batch: "JEE 2026", amount: "₹40,000", dueDate: "01 Apr 2026", paidOn: "30 Mar 2026", status: "Paid" },
];

function DemoBtn({ label }: { label: string }) {
  return (
    <button disabled title="Demo mode" className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold opacity-50 cursor-not-allowed">
      {label}
    </button>
  );
}

export default function AdminFees() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = records.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.rollNo.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || r.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <PortalLayout role="admin" navItems={adminNavItems} userName="Admin — Pinnacle" userSub="Full Access">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary">Fee Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">April 2026 · Track collections, send reminders, generate receipts</p>
        </div>
        <div className="flex gap-2">
          <DemoBtn label="Send Reminders" />
          <DemoBtn label="Export Report" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {summary.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <Icon className={`w-5 h-5 mb-2 ${s.color}`} />
              <div className="text-xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Bar Chart Placeholder */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-secondary" />
          <h2 className="font-bold text-foreground">Collection vs Target — April 2026</h2>
        </div>
        <div className="flex gap-4 items-end h-20">
          {[
            { label: "JEE",        collected: 88, target: 100 },
            { label: "NEET",       collected: 82, target: 100 },
            { label: "Boards",     collected: 79, target: 100 },
            { label: "Foundation", collected: 91, target: 100 },
          ].map((d) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-1 items-end" style={{ height: 64 }}>
                <div className="flex-1 bg-secondary/30 rounded-t" style={{ height: `${d.target * 0.64}px` }} />
                <div className="flex-1 bg-secondary rounded-t" style={{ height: `${d.collected * 0.64}px` }} />
              </div>
              <div className="text-[10px] text-muted-foreground">{d.label}</div>
              <div className="text-[10px] font-bold text-foreground">{d.collected}%</div>
            </div>
          ))}
          <div className="flex flex-col gap-1 text-[10px] text-muted-foreground self-start">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-secondary/30" />Target</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-secondary" />Collected</div>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search student…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          {["All", "Paid", "Pending", "Overdue"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary text-muted-foreground")}>
              {f}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Student</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Batch</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Due Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Paid On</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{r.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{r.rollNo}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.batch}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{r.amount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.dueDate}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.paidOn}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full",
                      r.status === "Paid" ? "bg-green-100 text-green-700" :
                      r.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    )}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {r.status !== "Paid" && <DemoBtn label="Mark Paid" />}
                      <DemoBtn label="Receipt" />
                      {r.status !== "Paid" && <DemoBtn label="Remind" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PortalLayout>
  );
}
