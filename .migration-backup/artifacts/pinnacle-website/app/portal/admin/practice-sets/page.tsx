import { requirePortalRole } from "@/lib/server/portal-auth";
import { listAllSetsForStaff } from "@/lib/server/practice-sets";
import { CreatePracticeSetButton } from "@/components/portal/CreatePracticeSetButton";
import Link from "next/link";
import { FolderOpen, Sparkles, Users, FileQuestion } from "lucide-react";

export const metadata = { title: "Practice Sets — Admin Panel" };

export default async function AdminPracticeSetsPage() {
  await requirePortalRole("admin");
  const sets = await listAllSetsForStaff();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Practice Sets</h1>
          <p className="text-slate-500 text-sm mt-1">Curate questions from the bank and assign them to batches or individual students.</p>
        </div>
        <CreatePracticeSetButton basePath="admin" />
      </div>

      {sets.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
          <p>No practice sets yet. Click <strong>New Practice Set</strong> to create one.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sets.map((s) => (
            <Link key={s.id} href={`/portal/admin/practice-sets/${s.id}`}
              className="card hover:shadow-elevated transition-all group">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FolderOpen size={16} className="text-[var(--color-teal)] shrink-0" />
                  <span className="font-bold text-[var(--color-navy)] truncate">{s.name}</span>
                </div>
                {!s.isActive && <span className="badge bg-slate-100 text-slate-500 text-[10px]">Inactive</span>}
              </div>
              {s.subject && <p className="text-xs text-slate-500 mb-2">{s.subject}</p>}
              {s.description && <p className="text-xs text-slate-500 line-clamp-2 mb-3">{s.description}</p>}
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><FileQuestion size={11} /> {s.questionCount} q</span>
                <span className="flex items-center gap-1"><Users size={11} /> {s.assignmentCount} assigned</span>
                {s.createdByName && <span className="ml-auto text-slate-400 truncate">by {s.createdByName}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
