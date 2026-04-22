import { useState } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { adminNavItems } from "./Dashboard";
import { Search, Phone, Mail, MessageSquare, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const enquiries = [
  { name: "Ananya Singh",      phone: "98765-11111", email: "ananya@email.com",   course: "JEE 2026",        date: "22 Apr, 10:12 AM", source: "Website",  status: "New",       note: "" },
  { name: "Rohan Gupta",       phone: "87654-22222", email: "rohan@email.com",    course: "NEET 2026",       date: "22 Apr, 9:04 AM",  source: "Walk-in",  status: "New",       note: "" },
  { name: "Priya Sharma (P)",  phone: "76543-33333", email: "priya.s@email.com",  course: "Class 12 PCM",    date: "21 Apr",           source: "WhatsApp", status: "Contacted", note: "Called, wants evening batch" },
  { name: "Vaibhav Jain",      phone: "65432-44444", email: "vaibhav@email.com",  course: "Foundation",      date: "21 Apr",           source: "Website",  status: "Enrolled",  note: "Joined FND-10 batch" },
  { name: "Meena Kumari (P)",  phone: "54321-55555", email: "meena@email.com",    course: "Class 10",        date: "20 Apr",           source: "Referral", status: "Contacted", note: "Interested in weekend batch" },
  { name: "Akash Verma",       phone: "43210-66666", email: "akash@email.com",    course: "JEE 2027",        date: "19 Apr",           source: "Google",   status: "Follow-up", note: "Will visit on Saturday" },
  { name: "Sunita Devi (P)",   phone: "32109-77777", email: "sunita@email.com",   course: "NEET 2026",       date: "18 Apr",           source: "Website",  status: "Enrolled",  note: "Joined NEET 2026 Day batch" },
  { name: "Ritesh Kumar",      phone: "21098-88888", email: "ritesh@email.com",   course: "Class 11 Found.", date: "17 Apr",           source: "Walk-in",  status: "Follow-up", note: "Waiting for fee discussion" },
];

const STATUS_COLORS: Record<string, string> = {
  "New":       "bg-blue-100 text-blue-700",
  "Contacted": "bg-yellow-100 text-yellow-700",
  "Follow-up": "bg-purple-100 text-purple-700",
  "Enrolled":  "bg-green-100 text-green-700",
};

const STATUSES = ["All", "New", "Contacted", "Follow-up", "Enrolled"];

function DemoBtn({ label, icon: Icon }: { label: string; icon?: React.FC<any> }) {
  return (
    <button disabled title="Demo mode" className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold opacity-50 cursor-not-allowed flex items-center gap-1">
      {Icon && <Icon className="w-3 h-3" />}{label}
    </button>
  );
}

export default function AdminEnquiries() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const filtered = enquiries.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.course.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === "All" || e.status === status;
    return matchSearch && matchStatus;
  });

  const counts = STATUSES.slice(1).map(s => ({ status: s, count: enquiries.filter(e => e.status === s).length }));

  return (
    <PortalLayout role="admin" navItems={adminNavItems} userName="Admin — Pinnacle" userSub="Full Access">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary">Enquiry Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Track, follow up, and convert admission enquiries</p>
        </div>
        <DemoBtn label="Export to Sheet" />
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {counts.map((c) => (
          <div key={c.status} className="bg-card border border-border rounded-xl p-4 text-center cursor-pointer" onClick={() => setStatus(c.status)}>
            <div className="text-2xl font-bold text-foreground">{c.count}</div>
            <div className={cn("text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block", STATUS_COLORS[c.status])}>{c.status}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search name or course…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={cn("px-3 py-1 rounded-full text-xs font-semibold border transition-all",
              status === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary text-muted-foreground")}>
            {s}
          </button>
        ))}
      </div>

      {/* Enquiry Cards */}
      <div className="space-y-3">
        {filtered.map((e, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
              {e.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-foreground">{e.name}</span>
                <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", STATUS_COLORS[e.status])}>{e.status}</span>
                <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{e.source}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">{e.course} · {e.date}</div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{e.phone}</span>
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{e.email}</span>
              </div>
              {e.note && <div className="text-xs italic text-muted-foreground mt-1">📝 {e.note}</div>}
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap">
              <DemoBtn label="Call" icon={Phone} />
              <DemoBtn label="WhatsApp" icon={MessageSquare} />
              <DemoBtn label="Enroll" icon={UserCheck} />
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No enquiries match your search.</div>
      )}
    </PortalLayout>
  );
}
