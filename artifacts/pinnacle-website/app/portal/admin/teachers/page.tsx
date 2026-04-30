import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { FACULTY } from "@/lib/data";

export const metadata = { title: "Teachers — Admin Panel" };

export default async function AdminTeachersPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Faculty</h1>
          <p className="text-slate-500 text-sm mt-1">{FACULTY.length} faculty members</p>
        </div>
        <button className="btn-primary py-2.5 px-5 text-sm"><Plus size={15} />Add Faculty</button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FACULTY.map((f) => (
          <div key={f.name} className="card hover:shadow-elevated transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-teal)] flex items-center justify-center text-white font-bold flex-shrink-0">{f.initials}</div>
              <div>
                <h3 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{f.name}</h3>
                <div className="text-[var(--color-gold)] text-xs font-medium mt-0.5">{f.designation}</div>
                <div className="text-slate-400 text-xs mt-1">{f.experience} exp</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {f.teaches.split(" · ").map((t) => (
                <span key={t} className="badge text-xs bg-[var(--color-teal)]/10 text-[var(--color-teal)]">{t}</span>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
              <button className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-[var(--color-navy)]/5 text-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-white transition-colors">Edit</button>
              <button className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-[var(--color-maroon)]/5 text-[var(--color-maroon)] hover:bg-[var(--color-maroon)] hover:text-white transition-colors">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
