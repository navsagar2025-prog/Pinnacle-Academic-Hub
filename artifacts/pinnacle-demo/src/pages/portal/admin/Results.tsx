import { PortalLayout } from "@/components/layout/PortalLayout";
import { adminNavItems } from "./Dashboard";
import { Trophy, Upload, Eye, Download, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const toppers = [
  { name: "Riya Kapoor",       batch: "NEET 2026",    score: "680/720", rank: "AIR 34 (Mock)", pct: 94 },
  { name: "Arjun Mehta",       batch: "JEE 2026",     score: "312/360", rank: "AIR 87 (Mock)",  pct: 87 },
  { name: "Divya Singh",       batch: "Class 12 PCM", score: "97%",     rank: "School Topper",  pct: 97 },
  { name: "Vaibhav Jain",      batch: "JEE 2026",     score: "294/360", rank: "AIR 210 (Mock)", pct: 82 },
];

const recentExams = [
  { exam: "JEE Mains Mock — April",  date: "14 Apr 2026", batch: "JEE 2026",    avg: 218, highest: 312, students: 60 },
  { exam: "NEET Mock Test — April",  date: "12 Apr 2026", batch: "NEET 2026",   avg: 536, highest: 680, students: 55 },
  { exam: "Unit Test — Thermodynamics", date: "10 Apr 2026", batch: "JEE 2026 — Eve", avg: 72, highest: 95, students: 32 },
  { exam: "Class 12 Board Mock",     date: "8 Apr 2026",  batch: "Cl-12 PCM",   avg: 81, highest: 97,  students: 40 },
];

function DemoBtn({ label, icon: Icon }: { label: string; icon?: React.FC<any> }) {
  return (
    <button disabled title="Demo mode" className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold opacity-50 cursor-not-allowed flex items-center gap-1">
      {Icon && <Icon className="w-3 h-3" />}{label}
    </button>
  );
}

export default function AdminResults() {
  return (
    <PortalLayout role="admin" navItems={adminNavItems} userName="Admin — Pinnacle" userSub="Full Access">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary">Results & Performance</h1>
          <p className="text-muted-foreground text-sm mt-1">Upload exam results, manage toppers showcase, and track progress</p>
        </div>
        <div className="flex gap-2">
          <DemoBtn label="Upload Results" icon={Upload} />
          <DemoBtn label="New Exam" icon={Plus} />
        </div>
      </div>

      {/* Toppers */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-accent" />
          <h2 className="font-bold text-foreground">Star Performers — April 2026</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {toppers.map((t, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-accent/20 text-accent font-bold text-lg flex items-center justify-center mx-auto mb-2">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "⭐"}
              </div>
              <div className="font-bold text-foreground">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.batch}</div>
              <div className="text-lg font-bold text-secondary mt-2">{t.score}</div>
              <div className="text-xs text-muted-foreground">{t.rank}</div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: `${t.pct}%` }} />
              </div>
              <div className="text-xs font-medium text-accent mt-1">{t.pct}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Exams */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-foreground">Recent Examinations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Exam</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Batch</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Students</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Avg Score</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Highest</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentExams.map((e, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium text-foreground">{e.exam}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.batch}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.date}</td>
                  <td className="px-4 py-3 text-foreground">{e.students}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{e.avg}</td>
                  <td className="px-4 py-3 font-semibold text-secondary">{e.highest}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <DemoBtn label="View" icon={Eye} />
                      <DemoBtn label="Export" icon={Download} />
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
