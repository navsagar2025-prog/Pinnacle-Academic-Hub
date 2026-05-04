import { db } from "@workspace/db";
import { teachers, users } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { Award, Mail, Phone, UserCheck } from "lucide-react";
import { AddFacultyButton, EditFacultyButton, RemoveFacultyButton } from "./TeacherModal";

export const metadata = { title: "Faculty — Admin Panel" };

export default async function AdminTeachersPage() {
  const rows = await db
    .select({
      id: teachers.id,
      designation: teachers.designation,
      qualification: teachers.qualification,
      subjects: teachers.subjects,
      experienceYears: teachers.experienceYears,
      initials: teachers.initials,
      bio: teachers.bio,
      isActive: teachers.isActive,
      isExaminer: teachers.isExaminer,
      photoUrl: teachers.photoUrl,
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
          <p className="text-slate-500 text-sm mt-1">{rows.length} faculty member{rows.length !== 1 ? "s" : ""}</p>
        </div>
        <AddFacultyButton />
      </div>

      {rows.length === 0 ? (
        <div className="card text-center py-12">
          <UserCheck size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400">No faculty records yet. Click <strong>Add Faculty</strong> to get started.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((f) => (
            <div key={f.id} className="card hover:shadow-elevated transition-all">
              <div className="flex items-start gap-4">
                {f.photoUrl ? (
                  <img
                    src={f.photoUrl}
                    alt={f.name ?? "Faculty"}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-[var(--color-teal)]/20"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-teal)] flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
                    {f.initials ?? (f.name ? f.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?")}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-[var(--color-navy)] font-[family-name:var(--font-playfair)] text-sm leading-tight">{f.name ?? "—"}</h3>
                    {f.isExaminer && (
                      <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                        <Award size={10} />Examiner
                      </span>
                    )}
                  </div>
                  <div className="text-[var(--color-gold)] text-xs font-medium mt-0.5">{f.designation}</div>
                  {f.experienceYears && <div className="text-slate-400 text-xs mt-0.5">{f.experienceYears} yr exp</div>}
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
                <EditFacultyButton teacher={f} />
                <RemoveFacultyButton teacherId={f.id} name={f.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
