import { useState } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { adminNavItems } from "./Dashboard";
import { Pin, Trash2, Edit3, Plus, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const notices = [
  { id: 1, title: "Mock Test — JEE Mains Full Syllabus — May 1, 2026", date: "20 Apr 2026", audience: "JEE Students",    pinned: true,  views: 187, author: "Admin" },
  { id: 2, title: "Holiday Notice: April 25 — Dr. B.R. Ambedkar Jayanti", date: "18 Apr 2026", audience: "All",        pinned: true,  views: 312, author: "Admin" },
  { id: 3, title: "Physics Notes Updated — Thermodynamics Module", date: "18 Apr 2026", audience: "JEE & Cl-12 PCM",  pinned: false, views: 94,  author: "Dr. Ramesh Kumar" },
  { id: 4, title: "NEET Biology Syllabus Change — 2026 Edition", date: "15 Apr 2026", audience: "NEET Students",      pinned: false, views: 143, author: "Ms. Priya Sharma" },
  { id: 5, title: "Fee Payment Deadline — April 30, 2026", date: "12 Apr 2026", audience: "All",                       pinned: false, views: 265, author: "Admin" },
  { id: 6, title: "Annual Prize Distribution Ceremony — May 15", date: "10 Apr 2026", audience: "All",                 pinned: false, views: 220, author: "Admin" },
];

function DemoBtn({ label, icon: Icon, danger }: { label: string; icon?: React.FC<any>; danger?: boolean }) {
  return (
    <button disabled title="Demo mode" className={cn(
      "px-2.5 py-1 rounded-lg text-[11px] font-semibold opacity-50 cursor-not-allowed flex items-center gap-1",
      danger ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
    )}>
      {Icon && <Icon className="w-3 h-3" />}{label}
    </button>
  );
}

export default function AdminNotices() {
  const [audience, setAudience] = useState("All");
  const audiences = ["All", "JEE Students", "NEET Students", "JEE & Cl-12 PCM", "All"];
  const uniqueAudiences = ["All", ...new Set(notices.map(n => n.audience).filter(a => a !== "All"))];

  const filtered = audience === "All" ? notices : notices.filter(n => n.audience === audience || n.audience === "All");

  return (
    <PortalLayout role="admin" navItems={adminNavItems} userName="Admin — Pinnacle" userSub="Full Access">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary">Notice Board Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Publish, pin, and manage all institute notices</p>
        </div>
        <button disabled title="Demo mode" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold opacity-50 cursor-not-allowed flex items-center gap-2">
          <Plus className="w-4 h-4" /> Post Notice
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {uniqueAudiences.map((a) => (
          <button key={a} onClick={() => setAudience(a)}
            className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
              audience === a ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary text-muted-foreground")}>
            {a}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((n) => (
          <div key={n.id} className={cn("bg-card border rounded-xl p-4 flex items-start gap-4", n.pinned ? "border-accent/60 bg-accent/5" : "border-border")}>
            {n.pinned && <Pin className="w-4 h-4 text-accent mt-1 shrink-0" />}
            {!n.pinned && <div className="w-4 shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground">{n.title}</div>
              <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
                <span>{n.date}</span>
                <span>·</span>
                <span>By {n.author}</span>
                <span>·</span>
                <span className="bg-primary/10 text-primary px-1.5 rounded">{n.audience}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{n.views} views</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <DemoBtn label="Edit" icon={Edit3} />
              <DemoBtn label="Pin" icon={Pin} />
              <DemoBtn label="Delete" icon={Trash2} danger />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        In production, notices push as instant notifications to all relevant student/parent accounts
      </p>
    </PortalLayout>
  );
}
