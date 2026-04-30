import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Users, Search, Plus, CheckCircle, Clock } from "lucide-react";

export const metadata = { title: "Students — Admin Panel" };

const STUDENTS = [
  { id: 1, name: "Aditya Verma", roll: "PAC-2026-001", batch: "JEE 2026 — Eve", phone: "9876543001", fee: "paid", enrolled: "15 Jul 2025" },
  { id: 2, name: "Sneha Patel", roll: "PAC-2026-002", batch: "NEET 2026 — Mor", phone: "9876543002", fee: "paid", enrolled: "16 Jul 2025" },
  { id: 3, name: "Rohan Mishra", roll: "PAC-2026-003", batch: "JEE 2026 — Mor", phone: "9876543003", fee: "due", enrolled: "17 Jul 2025" },
  { id: 4, name: "Priya Singh", roll: "PAC-2026-004", batch: "NEET 2026 — Eve", phone: "9876543004", fee: "paid", enrolled: "18 Jul 2025" },
  { id: 5, name: "Karan Yadav", roll: "PAC-2026-005", batch: "JEE 2026 — Eve", phone: "9876543005", fee: "paid", enrolled: "19 Jul 2025" },
  { id: 6, name: "Anjali Gupta", roll: "PAC-2026-006", batch: "Class 12 — Eve", phone: "9876543006", fee: "due", enrolled: "20 Jul 2025" },
  { id: 7, name: "Vikram Sharma", roll: "PAC-2026-007", batch: "JEE 2026 — Mor", phone: "9876543007", fee: "paid", enrolled: "21 Jul 2025" },
  { id: 8, name: "Riya Kumar", roll: "PAC-2026-008", batch: "NEET 2026 — Mor", phone: "9876543008", fee: "paid", enrolled: "22 Jul 2025" },
];

export default async function AdminStudentsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Students</h1>
          <p className="text-slate-500 text-sm mt-1">{STUDENTS.length} students shown (187 total)</p>
        </div>
        <button className="btn-primary py-2.5 px-5 text-sm"><Plus size={15} />Add Student</button>
      </div>

      <div className="card p-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-slate-light)] rounded-lg">
          <Search size={16} className="text-slate-400" />
          <input type="text" placeholder="Search by name, roll, or batch..." className="bg-transparent text-sm outline-none w-full text-slate-600 placeholder-slate-400" />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-slate-light)] border-b border-slate-100">
              <tr>
                {["Roll No.", "Name", "Batch", "Phone", "Fee", "Enrolled", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {STUDENTS.map((s) => (
                <tr key={s.id} className="hover:bg-[var(--color-slate-light)]/50 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">{s.roll}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[var(--color-navy)]/10 rounded-full flex items-center justify-center text-[var(--color-navy)] text-xs font-bold flex-shrink-0">{s.name.charAt(0)}</div>
                      <span className="font-semibold text-sm text-[var(--color-navy)] whitespace-nowrap">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{s.batch}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{s.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs flex items-center gap-1 w-fit ${s.fee === "paid" ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)]" : "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]"}`}>
                      {s.fee === "paid" ? <CheckCircle size={11} /> : <Clock size={11} />}
                      {s.fee === "paid" ? "Paid" : "Due"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{s.enrolled}</td>
                  <td className="px-4 py-3">
                    <button className="text-xs font-semibold text-[var(--color-teal)] hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
