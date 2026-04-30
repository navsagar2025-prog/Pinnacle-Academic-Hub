import { db } from "@workspace/db";
import { teachers, users } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { Plus, Mail, Phone } from "lucide-react";

export const metadata = { title: "Teachers — Admin Panel" };

export default async function AdminTeachersPage() {
  const rows = await db
    .select({
      id: teachers.id,
      designation: teachers.designation,
      qualification: teachers.qualification,
      subjects: teachers.subjects,
      experienceYears: teachers.experienceYears,
      initials: teachers.initials,
      isActive: teachers.isActive,
      name: users.name,
      email: users.email,
      phone: users.phone,
    })
    .from(teachers)
    .leftJoin(users, eq(teachers.userId, users.id))
    .where(eq(teachers.isActive, true))
    .orderBy(teachers.joinedAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Faculty</h1>
          <p className="text-slate-500 text-sm mt-1">{rows.length} faculty members</p>
        </div>
        <button className="btn-primary py-2.5 px-5 text-sm"><Plus size={15} />Add Faculty</button>
      </div>

      {rows.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">No faculty records found. Add a teacher to get started.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((f) => (
            <div key={f.id} className="card hover:shadow-elevated transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-teal)] flex items-center justify-center text-white font-bold flex-shrink-0">
                  {f.initials ?? (f.name ? f.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?")}
                </div>
                <div>
                  <h3 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)]">{f.name ?? "—"}</h3>
                  <div className="text-[var(--color-gold)] text-xs font-medium mt-0.5">{f.designation}</div>
                  {f.experienceYears && <div className="text-slate-400 text-xs mt-1">{f.experienceYears} yr exp</div>}
                </div>
              </div>
              {f.subjects && f.subjects.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {f.subjects.map((s) => (
                    <span key={s} className="badge text-xs bg-[var(--color-teal)]/10 text-[var(--color-teal)]">{s}</span>
                  ))}
                </div>
              )}
              <div className="mt-3 space-y-1">
                {f.email && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Mail size={11} />{f.email}
                  </div>
                )}
                {f.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Phone size={11} />{f.phone}
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                <button className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-[var(--color-navy)]/5 text-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-white transition-colors">Edit</button>
                <button className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-[var(--color-maroon)]/5 text-[var(--color-maroon)] hover:bg-[var(--color-maroon)] hover:text-white transition-colors">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
