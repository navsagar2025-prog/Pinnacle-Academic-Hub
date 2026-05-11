import { useState, useCallback } from "react";
import { useAuth, useUser, useClerk } from "@clerk/react";
import { LayoutDashboard, Bell, Calendar, Users, LogOut, Menu, AlertCircle } from "lucide-react";
import { useFetch } from "./portalUtils";

type Section = "overview" | "schedule" | "batches" | "notices";
const NAV: { key: Section; label: string; Icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", Icon: LayoutDashboard },
  { key: "schedule", label: "My Schedule", Icon: Calendar },
  { key: "batches", label: "My Batches", Icon: Users },
  { key: "notices", label: "Notices", Icon: Bell },
];

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
type ScheduleRow = { id: string; subject: string; topic: string | null; dayOfWeek: number; startTime: string; endTime: string; room: string | null; batchName: string | null };
type BatchRow = { id: string; name: string; timingLabel: string; daysLabel: string; status: string; maxStudents: number | null; courseName: string | null };
type Notice = { id: string; title: string; body: string; category: string; publishedAt: string };

const CAT_COLOR: Record<string, string> = {
  Academic: "bg-blue-100 text-blue-700", Test: "bg-purple-100 text-purple-700",
  Fee: "bg-red-100 text-red-700", Event: "bg-green-100 text-green-700",
  General: "bg-slate-100 text-slate-600",
};
const STATUS_COLOR: Record<string, string> = {
  active: "bg-green-100 text-green-700", upcoming: "bg-blue-100 text-blue-700",
  full: "bg-orange-100 text-orange-700", completed: "bg-slate-100 text-slate-500",
};

function NoProfile() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4"><AlertCircle size={28} /></div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-2">Teacher Profile Not Linked</h2>
      <p className="text-slate-500 text-sm max-w-sm">
        Your teacher profile hasn't been set up yet. Contact the admin at{" "}
        <a href="tel:+919971862138" className="text-[var(--color-teal)] font-semibold">+91 99718 62138</a>.
      </p>
    </div>
  );
}

function Overview({ teacher, getToken }: { teacher: TeacherInfo; getToken: () => Promise<string | null> }) {
  const { data: schedData } = useFetch<{ data: ScheduleRow[] }>("/portal/teacher/schedule", getToken);
  const { data: batchData } = useFetch<{ data: BatchRow[] }>("/portal/teacher/batches", getToken);
  const today = new Date().getDay();
  const todaySchedule = (schedData?.data ?? []).filter(s => s.dayOfWeek === today).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div>
      <div className="card border border-slate-200 mb-6 bg-gradient-to-br from-[#4b0082] to-[#7c3aed] text-white">
        <p className="text-white/60 text-sm mb-1">Welcome back</p>
        <h2 className="text-2xl font-bold font-[family-name:var(--font-playfair)]">{teacher.name}</h2>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <span className="bg-white/10 rounded-full px-3 py-1">🎓 {teacher.designation}</span>
          {teacher.qualification && <span className="bg-white/10 rounded-full px-3 py-1">📚 {teacher.qualification}</span>}
          {teacher.experienceYears && <span className="bg-white/10 rounded-full px-3 py-1">⏱ {teacher.experienceYears}y experience</span>}
        </div>
        {(teacher.subjects ?? []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {teacher.subjects!.map(s => <span key={s} className="text-xs bg-white/10 rounded px-2 py-0.5">{s}</span>)}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card border border-slate-200 text-center">
          <p className="text-3xl font-bold text-[var(--color-navy)]">{batchData?.data?.length ?? "—"}</p>
          <p className="text-xs text-slate-500 mt-1">My Batches</p>
        </div>
        <div className="card border border-slate-200 text-center">
          <p className="text-3xl font-bold text-[var(--color-navy)]">{todaySchedule.length}</p>
          <p className="text-xs text-slate-500 mt-1">Classes Today</p>
        </div>
      </div>
      {todaySchedule.length > 0 && (
        <div className="card border border-slate-200">
          <p className="font-semibold text-[var(--color-navy)] text-sm mb-3">Today's Classes ({DAYS[today]})</p>
          <div className="space-y-2">
            {todaySchedule.map(s => (
              <div key={s.id} className="flex items-center gap-3 text-sm">
                <span className="text-purple-600 font-mono text-xs w-20 shrink-0">{s.startTime}–{s.endTime}</span>
                <span className="font-medium text-[var(--color-navy)]">{s.subject}</span>
                <span className="text-slate-400 text-xs">{s.batchName ?? ""}{s.room ? ` · Room ${s.room}` : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type TeacherInfo = { name: string; designation: string; qualification: string | null; subjects: string[] | null; experienceYears: number | null };

function ScheduleSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading } = useFetch<{ data: ScheduleRow[] }>("/portal/teacher/schedule", getToken);
  if (loading) return <div className="text-slate-400 text-sm">Loading…</div>;
  const byDay = DAYS.map((day, idx) => ({
    day, rows: (data?.data ?? []).filter(s => s.dayOfWeek === idx).sort((a, b) => a.startTime.localeCompare(b.startTime)),
  })).filter(d => d.rows.length > 0);
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-5">Weekly Schedule</h2>
      {byDay.length === 0 && <p className="text-slate-400 text-sm">No schedule assigned yet.</p>}
      <div className="space-y-4">
        {byDay.map(({ day, rows }) => (
          <div key={day} className="card border border-slate-200">
            <p className="font-semibold text-[var(--color-navy)] text-sm mb-3">{day}</p>
            <div className="space-y-2">
              {rows.map(s => (
                <div key={s.id} className="flex items-center gap-3 text-sm bg-purple-50 rounded-lg px-3 py-2">
                  <span className="text-purple-600 font-mono text-xs w-20 shrink-0">{s.startTime}–{s.endTime}</span>
                  <div className="flex-1">
                    <span className="font-medium text-[var(--color-navy)]">{s.subject}</span>
                    {s.topic && <span className="text-slate-500 text-xs ml-2">({s.topic})</span>}
                  </div>
                  <div className="text-right shrink-0">
                    {s.batchName && <p className="text-xs text-slate-500">{s.batchName}</p>}
                    {s.room && <p className="text-xs text-slate-400">Room {s.room}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BatchesSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading } = useFetch<{ data: BatchRow[] }>("/portal/teacher/batches", getToken);
  if (loading) return <div className="text-slate-400 text-sm">Loading…</div>;
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-5">My Batches</h2>
      <div className="space-y-3">
        {(data?.data ?? []).map(b => (
          <div key={b.id} className="card border border-slate-200">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-[var(--color-navy)] text-sm">{b.name}</p>
                {b.courseName && <p className="text-xs text-slate-500 mt-0.5">{b.courseName}</p>}
                <p className="text-xs text-slate-400 mt-0.5">{b.timingLabel} · {b.daysLabel}</p>
                {b.maxStudents && <p className="text-xs text-slate-400 mt-0.5">Max {b.maxStudents} students</p>}
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[b.status] ?? "bg-slate-100 text-slate-500"}`}>{b.status}</span>
            </div>
          </div>
        ))}
        {(data?.data ?? []).length === 0 && <p className="text-slate-400 text-sm">No batches assigned yet.</p>}
      </div>
    </div>
  );
}

function NoticesSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading } = useFetch<{ data: Notice[] }>("/portal/teacher/notices", getToken);
  if (loading) return <div className="text-slate-400 text-sm">Loading…</div>;
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-5">Notices</h2>
      <div className="space-y-3">
        {(data?.data ?? []).map(n => (
          <div key={n.id} className="card border border-slate-200">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLOR[n.category] ?? "bg-slate-100 text-slate-600"}`}>{n.category}</span>
              <span className="text-xs text-slate-400">{new Date(n.publishedAt).toLocaleDateString("en-IN")}</span>
            </div>
            <p className="font-semibold text-[var(--color-navy)] text-sm">{n.title}</p>
            <p className="text-slate-500 text-sm mt-1">{n.body}</p>
          </div>
        ))}
        {(data?.data ?? []).length === 0 && <p className="text-slate-400 text-sm">No notices at this time.</p>}
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const [section, setSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const tokenFn = useCallback(() => getToken(), [getToken]);
  const { data: meData } = useFetch<{ data: { user: { name: string }; roleRecord: TeacherInfo | null } | null }>("/portal/me", tokenFn);
  const teacher = meData?.data?.roleRecord;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex bg-[var(--color-slate-light)]">
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-[#4b0082] flex flex-col transition-transform duration-300 top-0 lg:static lg:translate-x-0 lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center text-white font-bold text-sm">T</div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Teacher Portal</p>
              <p className="text-white/40 text-xs truncate max-w-[120px]">{clerkUser?.firstName ?? "Teacher"}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {NAV.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => { setSection(key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${section === key ? "bg-white/15 text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}>
              <Icon size={16} />{label}
            </button>
          ))}
        </nav>
        <div className="px-2 pb-4">
          <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className="flex-1 min-w-0">
        <div className="lg:hidden flex items-center gap-3 bg-[#4b0082] px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="text-white"><Menu size={20} /></button>
          <p className="text-white font-semibold text-sm">{NAV.find(n => n.key === section)?.label}</p>
        </div>
        <div className="p-6 max-w-4xl">
          {!teacher && section === "overview" ? <NoProfile /> : (
            <>
              {section === "overview" && teacher && <Overview teacher={{ ...teacher, name: meData?.data?.user.name ?? "" }} getToken={tokenFn} />}
              {section === "schedule" && <ScheduleSection getToken={tokenFn} />}
              {section === "batches" && <BatchesSection getToken={tokenFn} />}
              {section === "notices" && <NoticesSection getToken={tokenFn} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
