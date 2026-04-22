import { useState } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { adminNavItems } from "./Dashboard";
import { Search, Filter, Download, UserPlus, Mail, Phone, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const students = [
  { id: "JEE26-047", name: "Arjun Mehta",       batch: "JEE 2026",     course: "JEE",       fees: "Paid",    attendance: 92, phone: "98765-43210" },
  { id: "NEE26-012", name: "Riya Kapoor",        batch: "NEET 2026",    course: "NEET",      fees: "Paid",    attendance: 88, phone: "87654-32109" },
  { id: "C12-019",   name: "Siddharth Roy",      batch: "Class 12 PCM", course: "Boards",    fees: "Pending", attendance: 76, phone: "76543-21098" },
  { id: "FND-034",   name: "Nisha Verma",        batch: "Foundation",   course: "Foundation",fees: "Paid",    attendance: 95, phone: "65432-10987" },
  { id: "JEE26-051", name: "Karan Sharma",       batch: "JEE 2026",     course: "JEE",       fees: "Overdue", attendance: 61, phone: "54321-09876" },
  { id: "NEE26-028", name: "Ananya Patel",       batch: "NEET 2026",    course: "NEET",      fees: "Paid",    attendance: 84, phone: "43210-98765" },
  { id: "C12-007",   name: "Rahul Gupta",        batch: "Class 12 PCB", course: "Boards",    fees: "Paid",    attendance: 79, phone: "32109-87654" },
  { id: "FND-056",   name: "Pooja Singh",        batch: "Foundation",   course: "Foundation",fees: "Pending", attendance: 91, phone: "21098-76543" },
  { id: "JEE26-039", name: "Amit Srivastava",    batch: "JEE 2026",     course: "JEE",       fees: "Paid",    attendance: 87, phone: "10987-65432" },
  { id: "NEE26-041", name: "Divya Joshi",        batch: "NEET 2026",    course: "NEET",      fees: "Overdue", attendance: 55, phone: "09876-54321" },
];

const COURSES = ["All", "JEE", "NEET", "Boards", "Foundation"];
const FEE_STATUSES = ["All", "Paid", "Pending", "Overdue"];

function DemoBtn({ label, small }: { label: string; small?: boolean }) {
  return (
    <button disabled title="Demo mode" className={cn(
      "rounded-lg bg-primary text-primary-foreground font-semibold opacity-50 cursor-not-allowed",
      small ? "px-2.5 py-1 text-[11px]" : "px-4 py-2 text-sm"
    )}>{label}</button>
  );
}

export default function AdminStudents() {
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("All");
  const [feeFilter, setFeeFilter] = useState("All");

  const filtered = students.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase());
    const matchCourse = course === "All" || s.course === course;
    const matchFee = feeFilter === "All" || s.fees === feeFilter;
    return matchSearch && matchCourse && matchFee;
  });

  return (
    <PortalLayout role="admin" navItems={adminNavItems} userName="Admin — Pinnacle" userSub="Full Access">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary">Student Management</h1>
          <p className="text-muted-foreground text-sm mt-1">{students.length} students enrolled across all batches</p>
        </div>
        <div className="flex gap-2">
          <DemoBtn label="Export CSV" />
          <DemoBtn label="+ Enroll Student" />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or roll number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground self-center" />
          {COURSES.map((c) => (
            <button key={c} onClick={() => setCourse(c)}
              className={cn("px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                course === c ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary text-muted-foreground")}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {FEE_STATUSES.map((f) => (
            <button key={f} onClick={() => setFeeFilter(f)}
              className={cn("px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                feeFilter === f ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary text-muted-foreground")}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase">Student</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase">Roll No</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase">Batch</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase">Attendance</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase">Fee Status</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {s.name[0]}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.phone}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.id}</td>
                <td className="px-4 py-3 text-foreground">{s.batch}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-secondary" style={{ width: `${s.attendance}%` }} />
                    </div>
                    <span className={cn("text-xs font-medium", s.attendance < 75 ? "text-destructive" : "text-foreground")}>
                      {s.attendance}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full",
                    s.fees === "Paid" ? "bg-green-100 text-green-700" :
                    s.fees === "Pending" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  )}>{s.fees}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <DemoBtn label="Edit" small />
                    <DemoBtn label="Fees" small />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No students match your filters.</div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Showing {filtered.length} of {students.length} students · Full database with 500+ students available in production
      </p>
    </PortalLayout>
  );
}
