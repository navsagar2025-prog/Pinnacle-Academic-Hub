import { PortalLayout } from "@/components/layout/PortalLayout";
import { adminNavItems } from "./Dashboard";
import { Mail, Phone, Star, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const teachers = [
  { name: "Dr. Ramesh Kumar",   subject: "Physics",   batches: ["JEE 2026 Eve", "JEE 2026 Morn", "Cl-12 PCM"],  classes: 22, students: 87, rating: 4.9, exp: "14 yrs", phone: "98765-43210", email: "ramesh@pinnacle.in" },
  { name: "Ms. Priya Sharma",   subject: "Biology",   batches: ["NEET 2026 Morn", "NEET 2026 Eve"],             classes: 18, students: 64, rating: 4.8, exp: "9 yrs",  phone: "87654-32109", email: "priya@pinnacle.in" },
  { name: "Mr. Ajay Tiwari",    subject: "Maths",     batches: ["JEE 2026 Eve", "Cl-12 PCM", "Cl-11 Found"],   classes: 26, students: 94, rating: 4.7, exp: "11 yrs", phone: "76543-21098", email: "ajay@pinnacle.in" },
  { name: "Ms. Nidhi Verma",    subject: "Chemistry", batches: ["JEE 2026 Morn", "NEET 2026 Morn"],            classes: 20, students: 72, rating: 4.8, exp: "7 yrs",  phone: "65432-10987", email: "nidhi@pinnacle.in" },
  { name: "Mr. Suresh Pandey",  subject: "English",   batches: ["Cl-12 PCM", "Cl-12 PCB", "Cl-12 Comm"],      classes: 14, students: 76, rating: 4.5, exp: "12 yrs", phone: "54321-09876", email: "suresh@pinnacle.in" },
  { name: "Ms. Kavita Joshi",   subject: "Commerce",  batches: ["Cl-12 Comm", "Cl-11 Comm"],                   classes: 16, students: 45, rating: 4.6, exp: "8 yrs",  phone: "43210-98765", email: "kavita@pinnacle.in" },
];

function DemoBtn({ label }: { label: string }) {
  return (
    <button disabled title="Demo mode" className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold opacity-50 cursor-not-allowed">
      {label}
    </button>
  );
}

export default function AdminTeachers() {
  return (
    <PortalLayout role="admin" navItems={adminNavItems} userName="Admin — Pinnacle" userSub="Full Access">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary">Teacher Management</h1>
          <p className="text-muted-foreground text-sm mt-1">{teachers.length} faculty members across all departments</p>
        </div>
        <button disabled title="Demo mode" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold opacity-50 cursor-not-allowed flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Add Teacher
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {teachers.map((t, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold shrink-0">
                {t.name.split(" ").map(n => n[0]).join("").slice(0,2)}
              </div>
              <div className="flex-1">
                <div className="font-bold text-foreground">{t.name}</div>
                <div className="text-sm text-secondary font-medium">{t.subject}</div>
                <div className="text-xs text-muted-foreground">{t.exp} experience</div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-accent">
                <Star className="w-3.5 h-3.5 fill-current" />
                {t.rating}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Batches",  val: t.batches.length },
                { label: "Students", val: t.students },
                { label: "Classes",  val: t.classes },
              ].map((s) => (
                <div key={s.label} className="bg-background rounded-lg p-2 border border-border">
                  <div className="font-bold text-foreground">{s.val}</div>
                  <div className="text-[10px] text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-1">
              {t.batches.map((b) => (
                <span key={b} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{b}</span>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{t.phone}</span>
              <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3" />{t.email}</span>
            </div>

            <div className="flex gap-2 pt-1">
              <DemoBtn label="Edit Profile" />
              <DemoBtn label="View Schedule" />
              <DemoBtn label="Payslip" />
            </div>
          </div>
        ))}
      </div>
    </PortalLayout>
  );
}
