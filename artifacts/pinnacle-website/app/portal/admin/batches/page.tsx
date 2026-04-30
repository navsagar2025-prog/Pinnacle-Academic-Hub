import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Users, Clock, Plus } from "lucide-react";

export const metadata = { title: "Batches — Admin Panel" };

const BATCHES = [
  { id: 1, name: "JEE 2026 — Morning", course: "JEE Main & Advanced", timing: "9:00 AM – 12:00 PM", days: "Mon–Sat", students: 25, capacity: 30, faculty: "Dr. R. Kumar, Ms. P. Sharma, Mr. A. Tiwari", status: "active" },
  { id: 2, name: "JEE 2026 — Evening", course: "JEE Main & Advanced", timing: "5:00 PM – 8:30 PM", days: "Mon–Fri", students: 28, capacity: 30, faculty: "Dr. R. Kumar, Ms. P. Sharma, Mr. A. Tiwari", status: "active" },
  { id: 3, name: "NEET 2026 — Morning", course: "NEET UG", timing: "9:00 AM – 12:00 PM", days: "Mon–Sat", students: 27, capacity: 30, faculty: "Mr. S. Gupta, Ms. P. Sharma, Ms. N. Verma", status: "active" },
  { id: 4, name: "NEET 2026 — Evening", course: "NEET UG", timing: "5:00 PM – 8:30 PM", days: "Mon–Fri", students: 24, capacity: 30, faculty: "Mr. S. Gupta, Ms. P. Sharma, Ms. N. Verma", status: "active" },
  { id: 5, name: "Class 12 — Evening", course: "Class 11 & 12 Board", timing: "4:00 PM – 7:00 PM", days: "Mon–Sat", students: 35, capacity: 35, faculty: "Ms. P. Sharma, Mr. A. Tiwari", status: "full" },
  { id: 6, name: "Class 10 — Afternoon", course: "Class 9 & 10", timing: "2:00 PM – 5:00 PM", days: "Mon–Fri", students: 32, capacity: 40, faculty: "Ms. A. Gupta", status: "active" },
  { id: 7, name: "Foundation — Afternoon", course: "Foundation (Gr. 6–8)", timing: "2:00 PM – 4:30 PM", days: "Mon–Fri", students: 28, capacity: 40, faculty: "Ms. A. Gupta", status: "active" },
  { id: 8, name: "JEE 2027 — Summer", course: "JEE Main & Advanced", timing: "TBD", days: "Mon–Sat", students: 0, capacity: 30, faculty: "TBD", status: "upcoming" },
];

export default async function AdminBatchesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Batches</h1>
          <p className="text-slate-500 text-sm mt-1">{BATCHES.length} batches · {BATCHES.reduce((s, b) => s + b.students, 0)} total students</p>
        </div>
        <button className="btn-primary py-2.5 px-5 text-sm"><Plus size={15} />Create Batch</button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {BATCHES.map((b) => (
          <div key={b.id} className="card hover:shadow-elevated transition-all">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)] text-sm">{b.name}</h3>
              <span className={`badge text-xs ${b.status === "active" ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)]" : b.status === "full" ? "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]" : "bg-[var(--color-gold)]/15 text-[var(--color-navy)]"}`}>{b.status}</span>
            </div>
            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2"><Clock size={12} />{b.timing} · {b.days}</div>
              <div className="flex items-center gap-2"><Users size={12} />{b.students}/{b.capacity} students</div>
              <div className="text-xs text-slate-400">{b.course}</div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Capacity</span>
                <span className="font-semibold text-[var(--color-navy)]">{b.students}/{b.capacity}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${b.students / b.capacity >= 1 ? "bg-[var(--color-maroon)]" : b.students / b.capacity >= 0.8 ? "bg-[var(--color-gold)]" : "bg-[var(--color-teal)]"}`}
                  style={{ width: `${Math.min(100, (b.students / b.capacity) * 100)}%` }} />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
              <button className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-[var(--color-navy)]/5 text-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-white transition-colors">Manage</button>
              <button className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-[var(--color-teal)]/5 text-[var(--color-teal)] hover:bg-[var(--color-teal)] hover:text-white transition-colors">Timetable</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
