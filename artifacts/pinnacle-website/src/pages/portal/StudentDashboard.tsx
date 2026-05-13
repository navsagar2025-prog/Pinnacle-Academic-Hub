import { useState, useCallback, useEffect } from "react";
import { useAuth, useUser } from "@clerk/react";
import {
  LayoutDashboard, Bell, BookOpen, ClipboardList, BarChart2,
  CalendarCheck, CreditCard, LogOut, Menu, Download, AlertCircle,
  Video, MessageCircle, ExternalLink, Send, CheckCircle2,
} from "lucide-react";
import { useClerk } from "@clerk/react";
import { useFetch, apiMutation, trackEvent } from "./portalUtils";

type Section = "overview" | "notices" | "materials" | "assignments" | "tests" | "recordings" | "doubts" | "attendance" | "fees";

const NAV: { key: Section; label: string; Icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", Icon: LayoutDashboard },
  { key: "notices", label: "Notices", Icon: Bell },
  { key: "materials", label: "Study Materials", Icon: BookOpen },
  { key: "assignments", label: "Assignments", Icon: ClipboardList },
  { key: "tests", label: "Mock Tests", Icon: BarChart2 },
  { key: "recordings", label: "Recordings", Icon: Video },
  { key: "doubts", label: "Ask a Doubt", Icon: MessageCircle },
  { key: "attendance", label: "Attendance", Icon: CalendarCheck },
  { key: "fees", label: "Fee Records", Icon: CreditCard },
];

function NoProfile() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
        <AlertCircle size={28} />
      </div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-2">Profile Not Set Up Yet</h2>
      <p className="text-slate-500 text-sm max-w-sm">
        Your student profile hasn't been created yet. Please contact the Pinnacle office or call{" "}
        <a href="tel:+919971862138" className="text-[var(--color-teal)] font-semibold">+91 99718 62138</a>{" "}
        to complete your enrollment and link your account.
      </p>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="card border border-slate-200">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 ${color}`}>{icon}</div>
      <p className="text-2xl font-bold text-[var(--color-navy)]">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

function Overview({ profile, getToken }: { profile: ProfileData; getToken: () => Promise<string | null> }) {
  const { data: att } = useFetch<{ stats: { pct: number; present: number; total: number } }>("/portal/student/attendance", getToken);
  const { data: fees } = useFetch<{ data: FeeRecord[] }>("/portal/student/fee-records", getToken);
  const dueAmount = (fees?.data ?? []).filter(f => f.status === "due" || f.status === "overdue").reduce((s, f) => s + (f.amount - f.paidAmount), 0);

  return (
    <div>
      <div className="card border border-slate-200 mb-6 bg-gradient-to-br from-[var(--color-navy)] to-[#1a3580] text-white">
        <p className="text-white/60 text-sm mb-1">Welcome back</p>
        <h2 className="text-2xl font-bold font-[family-name:var(--font-playfair)]">{profile.user.name}</h2>
        {profile.roleRecord && (
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <span className="bg-white/10 rounded-full px-3 py-1">🎓 {profile.roleRecord.courseName ?? "Course TBD"}</span>
            <span className="bg-white/10 rounded-full px-3 py-1">📋 Batch: {profile.roleRecord.batchName ?? "TBD"}</span>
            {profile.roleRecord.rollNumber && <span className="bg-white/10 rounded-full px-3 py-1">🆔 Roll: {profile.roleRecord.rollNumber}</span>}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Attendance" value={att?.stats ? `${att.stats.pct}%` : "—"} icon="📅" color="bg-green-50 text-green-600" />
        <StatCard label="Classes Attended" value={att?.stats?.present ?? "—"} icon="✅" color="bg-blue-50 text-blue-600" />
        <StatCard label="Fee Due (₹)" value={dueAmount > 0 ? `₹${dueAmount.toLocaleString("en-IN")}` : "Nil"} icon="💰" color={dueAmount > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"} />
        <StatCard label="Batch" value={profile.roleRecord?.batchTiming ?? "—"} icon="🕐" color="bg-purple-50 text-purple-600" />
      </div>
    </div>
  );
}

type Notice = { id: string; title: string; body: string; category: string; publishedAt: string };
type Material = { id: string; title: string; subject: string; type: string; fileUrl: string | null; fileSize: string | null };
type Assignment = { id: string; title: string; subject: string; description: string | null; dueDate: string; maxMarks: number | null };
type FeeRecord = { id: string; period: string; amount: number; paidAmount: number; dueDate: string; status: string; paidDate: string | null; paymentMethod: string | null; transactionRef: string | null };
type MockTest = { id: string; title: string; subject: string; durationMinutes: number; marksPerQuestion: number; scheduledStart: string | null };
type AttRow = { id: string; date: string; subject: string; status: string };
type ProfileData = { user: { name: string; email: string }; roleRecord: { rollNumber: string; batchName: string; batchTiming: string; batchDays: string; courseName: string; batchId: string } | null };

const CATEGORY_COLOR: Record<string, string> = {
  Academic: "bg-blue-100 text-blue-700", Test: "bg-purple-100 text-purple-700",
  Fee: "bg-red-100 text-red-700", Event: "bg-green-100 text-green-700",
  Admissions: "bg-orange-100 text-orange-700", General: "bg-slate-100 text-slate-600",
};
const FEE_COLOR: Record<string, string> = {
  paid: "bg-green-100 text-green-700", partial: "bg-yellow-100 text-yellow-700",
  due: "bg-red-100 text-red-600", overdue: "bg-red-200 text-red-800", waived: "bg-slate-100 text-slate-600",
};
const ATT_COLOR: Record<string, string> = { present: "bg-green-500", absent: "bg-red-400", late: "bg-yellow-400" };
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function NoticesSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading } = useFetch<{ data: Notice[] }>("/portal/student/notices", getToken);
  if (loading) return <div className="text-slate-400 text-sm">Loading…</div>;
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-5">Notice Board</h2>
      <div className="space-y-3">
        {(data?.data ?? []).map(n => (
          <div key={n.id} className="card border border-slate-200">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[n.category] ?? "bg-slate-100 text-slate-600"}`}>{n.category}</span>
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

function MaterialsSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading } = useFetch<{ data: Material[] }>("/portal/student/materials", getToken);
  if (loading) return <div className="text-slate-400 text-sm">Loading…</div>;
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-5">Study Materials</h2>
      <div className="space-y-3">
        {(data?.data ?? []).map(m => (
          <div key={m.id} className="card border border-slate-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-lg shrink-0">📄</div>
            <div className="flex-1">
              <p className="font-semibold text-[var(--color-navy)] text-sm">{m.title}</p>
              <p className="text-xs text-slate-500">{m.subject} · {m.type}{m.fileSize ? ` · ${m.fileSize}` : ""}</p>
            </div>
            {m.fileUrl && (
              <a
                href={m.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm text-[var(--color-teal)] font-medium hover:underline shrink-0"
                onClick={() => trackEvent("pinnacle_material_downloaded", { material_id: m.id, title: m.title, subject: m.subject, file_type: m.type })}
              >
                <Download size={14} /> Download
              </a>
            )}
          </div>
        ))}
        {(data?.data ?? []).length === 0 && <p className="text-slate-400 text-sm">No study materials have been uploaded yet.</p>}
      </div>
    </div>
  );
}

function AssignmentsSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading } = useFetch<{ data: Assignment[] }>("/portal/student/assignments", getToken);

  useEffect(() => {
    if (!loading && data) {
      trackEvent("pinnacle_assignment_viewed", { assignment_count: (data.data ?? []).length });
    }
  }, [loading, data]);

  if (loading) return <div className="text-slate-400 text-sm">Loading…</div>;
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-5">Assignments</h2>
      <div className="space-y-3">
        {(data?.data ?? []).map(a => {
          const overdue = new Date(a.dueDate) < new Date();
          return (
            <div key={a.id} className={`card border ${overdue ? "border-red-200" : "border-slate-200"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--color-navy)] text-sm">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{a.subject}{a.maxMarks ? ` · ${a.maxMarks} marks` : ""}</p>
                  {a.description && <p className="text-xs text-slate-400 mt-1">{a.description}</p>}
                </div>
                <div className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${overdue ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                  Due: {new Date(a.dueDate).toLocaleDateString("en-IN")}
                </div>
              </div>
            </div>
          );
        })}
        {(data?.data ?? []).length === 0 && <p className="text-slate-400 text-sm">No assignments posted yet.</p>}
      </div>
    </div>
  );
}

function MockTestsSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading, reload } = useFetch<{ data: MockTest[]; attempts: { testId: string; score: number; maxScore: number; isCompleted: boolean }[] }>("/portal/student/mock-tests", getToken);
  const [submitModal, setSubmitModal] = useState<MockTest | null>(null);
  const [scoreInput, setScoreInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && data) {
      trackEvent("pinnacle_practice_section_viewed", { test_count: (data.data ?? []).length });
    }
  }, [loading, data]);

  const handleStart = (t: MockTest) => {
    trackEvent("pinnacle_practice_started", { test_id: t.id, title: t.title, subject: t.subject, duration_minutes: t.durationMinutes });
    setScoreInput("");
    setSubmitErr(null);
    setSubmitModal(t);
  };

  const handleSubmit = async () => {
    if (!submitModal) return;
    const score = parseInt(scoreInput, 10);
    const maxScore = submitModal.marksPerQuestion * 40;
    if (isNaN(score) || score < 0 || score > maxScore) { setSubmitErr(`Enter a score between 0 and ${maxScore}`); return; }
    setSubmitting(true);
    setSubmitErr(null);
    try {
      const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
      const token = await getToken();
      const serverMaxScore = submitModal.marksPerQuestion * 40;
      const res = await fetch(`${BASE}/api/v1/portal/student/mock-tests/${submitModal.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ score }),
      });
      const json = await res.json();
      if (res.ok) {
        trackEvent("pinnacle_practice_submitted", { test_id: submitModal.id, title: submitModal.title, subject: submitModal.subject, score, max_score: serverMaxScore });
        setSubmitModal(null);
        reload();
      } else {
        setSubmitErr(json.error ?? "Failed to submit");
      }
    } catch {
      setSubmitErr("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-slate-400 text-sm">Loading…</div>;
  const attemptMap = new Map((data?.attempts ?? []).map(a => [a.testId, a]));
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-5">Mock Tests</h2>
      <div className="space-y-3">
        {(data?.data ?? []).map(t => {
          const attempt = attemptMap.get(t.id);
          return (
            <div key={t.id} className="card border border-slate-200 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-lg shrink-0">📝</div>
              <div className="flex-1">
                <p className="font-semibold text-[var(--color-navy)] text-sm">{t.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t.subject} · {t.durationMinutes} min · {t.marksPerQuestion} marks/q</p>
                {t.scheduledStart && <p className="text-xs text-slate-400 mt-0.5">Scheduled: {new Date(t.scheduledStart).toLocaleString("en-IN")}</p>}
              </div>
              {attempt?.isCompleted ? (
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-green-600">{attempt.score}/{attempt.maxScore}</p>
                  <p className="text-xs text-slate-400">Completed</p>
                </div>
              ) : (
                <button
                  onClick={() => handleStart(t)}
                  className="text-xs bg-blue-100 text-blue-700 font-medium px-3 py-1.5 rounded-full shrink-0 self-center hover:bg-blue-200 transition-colors"
                >
                  Start & Submit
                </button>
              )}
            </div>
          );
        })}
        {(data?.data ?? []).length === 0 && <p className="text-slate-400 text-sm">No mock tests published yet.</p>}
      </div>

      {submitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-bold text-[var(--color-navy)] mb-1">{submitModal.title}</h3>
            <p className="text-xs text-slate-500 mb-4">{submitModal.subject} · {submitModal.durationMinutes} min</p>
            <p className="text-sm text-slate-600 mb-3">After completing the test offline or on paper, enter your score to record it.</p>
            <label className="block text-xs font-medium text-slate-600 mb-1">Your score (out of {submitModal.marksPerQuestion * 40})</label>
            <input
              type="number" value={scoreInput} onChange={e => setScoreInput(e.target.value)}
              min={0} max={submitModal.marksPerQuestion * 40}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
              placeholder={`0 – ${submitModal.marksPerQuestion * 40}`}
            />
            {submitErr && <p className="text-xs text-red-500 mb-3">{submitErr}</p>}
            <div className="flex gap-2">
              <button onClick={() => setSubmitModal(null)} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting || !scoreInput}
                className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-navy)] text-white text-sm font-medium hover:bg-[#1a3580] disabled:opacity-50 transition-colors">
                {submitting ? "Saving…" : "Submit Score"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type Recording = { id: string; title: string; subject: string; teacherName: string | null; recordingUrl: string; sourceProvider: string; classDate: string | null; durationMinutes: number | null; viewCount: number };
type Doubt = { id: string; subject: string; topic: string | null; questionText: string; isResolved: boolean; answerCount: number; createdAt: string };

const SUBJECTS_LIST = ["Physics", "Chemistry", "Mathematics", "Biology", "English", "General"];
const SOURCE_LABEL: Record<string, string> = { zoom: "Zoom", youtube: "YouTube", google_meet: "Google Meet" };

function RecordingsSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading } = useFetch<{ data: Recording[] }>("/portal/student/recordings", getToken);
  if (loading) return <div className="text-slate-400 text-sm">Loading…</div>;
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-5">Class Recordings</h2>
      <div className="space-y-3">
        {(data?.data ?? []).map(r => (
          <div key={r.id} className="card border border-slate-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-lg shrink-0">
              <Video size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--color-navy)] text-sm">{r.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {r.subject}{r.teacherName ? ` · ${r.teacherName}` : ""}{r.durationMinutes ? ` · ${r.durationMinutes} min` : ""}
                {r.classDate ? ` · ${new Date(r.classDate).toLocaleDateString("en-IN")}` : ""}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{SOURCE_LABEL[r.sourceProvider] ?? r.sourceProvider}</p>
            </div>
            <a
              href={r.recordingUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-sm text-[var(--color-teal)] font-medium hover:underline shrink-0"
              onClick={() => trackEvent("pinnacle_recording_viewed", { recording_id: r.id, title: r.title, subject: r.subject, source_provider: r.sourceProvider })}
            >
              <ExternalLink size={14} /> Watch
            </a>
          </div>
        ))}
        {(data?.data ?? []).length === 0 && <p className="text-slate-400 text-sm">No class recordings available yet. Check back after your next class.</p>}
      </div>
    </div>
  );
}

function DoubtsSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading, reload } = useFetch<{ data: Doubt[] }>("/portal/student/doubts", getToken);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !questionText.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await apiMutation("POST", "/portal/student/doubts", { subject, topic, questionText }, getToken);
      if (res.ok) {
        const created = res.data as { id?: string } | undefined;
        trackEvent("pinnacle_doubt_submitted", { subject, doubt_id: created?.id, has_topic: Boolean(topic) });
        setSubject("");
        setTopic("");
        setQuestionText("");
        setSubmitted(true);
        reload();
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        setSubmitError((res as { error?: string }).error ?? "Failed to submit");
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-5">Ask a Doubt</h2>
      <div className="card border border-slate-200 mb-6">
        <h3 className="text-sm font-semibold text-[var(--color-navy)] mb-4">Submit a new question</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Subject *</label>
              <select value={subject} onChange={e => setSubject(e.target.value)} required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]">
                <option value="">Select subject</option>
                {SUBJECTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Topic (optional)</label>
              <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Thermodynamics"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Your question *</label>
            <textarea value={questionText} onChange={e => setQuestionText(e.target.value)} required rows={3}
              placeholder="Describe your doubt clearly…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] resize-none" />
          </div>
          {submitError && <p className="text-xs text-red-500">{submitError}</p>}
          {submitted && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 size={14} /> Doubt submitted! A teacher will respond soon.
            </div>
          )}
          <button type="submit" disabled={submitting || !subject || !questionText.trim()}
            className="flex items-center gap-2 bg-[var(--color-navy)] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#1a3580] disabled:opacity-50 transition-colors">
            <Send size={14} /> {submitting ? "Submitting…" : "Submit Doubt"}
          </button>
        </form>
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-navy)] mb-3">Your past doubts</h3>
      {loading ? <div className="text-slate-400 text-sm">Loading…</div> : (
        <div className="space-y-3">
          {(data?.data ?? []).map(d => (
            <div key={d.id} className="card border border-slate-200">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{d.subject}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.isResolved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {d.isResolved ? "Resolved" : "Open"}
                </span>
              </div>
              {d.topic && <p className="text-xs text-slate-400 mb-1">Topic: {d.topic}</p>}
              <p className="text-sm text-[var(--color-navy)]">{d.questionText}</p>
              <p className="text-xs text-slate-400 mt-1.5">
                {d.answerCount} answer{d.answerCount !== 1 ? "s" : ""} · {new Date(d.createdAt).toLocaleDateString("en-IN")}
              </p>
            </div>
          ))}
          {(data?.data ?? []).length === 0 && <p className="text-slate-400 text-sm">You haven't submitted any doubts yet.</p>}
        </div>
      )}
    </div>
  );
}

function AttendanceSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading } = useFetch<{ data: AttRow[]; stats: { pct: number; present: number; total: number } }>("/portal/student/attendance", getToken);
  if (loading) return <div className="text-slate-400 text-sm">Loading…</div>;
  const stats = data?.stats;
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-5">Attendance</h2>
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card border border-slate-200 text-center">
            <p className={`text-3xl font-bold ${stats.pct >= 75 ? "text-green-600" : "text-red-500"}`}>{stats.pct}%</p>
            <p className="text-xs text-slate-500 mt-1">Overall</p>
          </div>
          <div className="card border border-slate-200 text-center">
            <p className="text-3xl font-bold text-[var(--color-navy)]">{stats.present}</p>
            <p className="text-xs text-slate-500 mt-1">Present</p>
          </div>
          <div className="card border border-slate-200 text-center">
            <p className="text-3xl font-bold text-slate-500">{stats.total - stats.present}</p>
            <p className="text-xs text-slate-500 mt-1">Absent</p>
          </div>
        </div>
      )}
      {stats && stats.pct < 75 && (
        <div className="mb-4 flex items-center gap-2 text-sm bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          <AlertCircle size={16} /> Your attendance is below 75%. Please attend classes regularly.
        </div>
      )}
      <div className="space-y-2">
        {(data?.data ?? []).slice(0, 30).map(r => (
          <div key={r.id} className="flex items-center gap-3 text-sm">
            <div className={`w-2.5 h-2.5 rounded-full ${ATT_COLOR[r.status] ?? "bg-slate-300"}`} />
            <span className="text-slate-600 w-24 shrink-0">{new Date(r.date).toLocaleDateString("en-IN")}</span>
            <span className="text-slate-700 flex-1">{r.subject}</span>
            <span className={`text-xs capitalize ${r.status === "present" ? "text-green-600" : r.status === "absent" ? "text-red-500" : "text-yellow-600"}`}>{r.status}</span>
          </div>
        ))}
        {(data?.data ?? []).length === 0 && <p className="text-slate-400 text-sm">No attendance records yet.</p>}
      </div>
    </div>
  );
}

function FeesSection({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, loading } = useFetch<{ data: FeeRecord[]; summary: { totalFee: number; totalPaid: number; totalDue: number; nextDue: string | null } }>("/portal/fees", getToken);
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadReceipt = async (feeId: string) => {
    setDownloading(feeId);
    try {
      const token = await getToken();
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/v1/portal/fees/receipt/${feeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      alert("Could not download receipt. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <div className="text-slate-400 text-sm">Loading…</div>;
  const records = data?.data ?? [];
  const summary = data?.summary;
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-navy)] mb-5">Fee Records</h2>
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card border border-slate-200 text-center">
            <p className="text-xs text-slate-400 mb-1">Total Fee</p>
            <p className="text-lg font-bold text-[var(--color-navy)]">₹{summary.totalFee.toLocaleString("en-IN")}</p>
          </div>
          <div className="card border border-slate-200 text-center">
            <p className="text-xs text-slate-400 mb-1">Total Paid</p>
            <p className="text-lg font-bold text-green-600">₹{summary.totalPaid.toLocaleString("en-IN")}</p>
          </div>
          <div className={`card border text-center ${summary.totalDue > 0 ? "border-red-200 bg-red-50" : "border-slate-200"}`}>
            <p className="text-xs text-slate-400 mb-1">Amount Due</p>
            <p className={`text-lg font-bold ${summary.totalDue > 0 ? "text-red-600" : "text-green-600"}`}>
              {summary.totalDue > 0 ? `₹${summary.totalDue.toLocaleString("en-IN")}` : "Nil"}
            </p>
          </div>
          <div className="card border border-slate-200 text-center">
            <p className="text-xs text-slate-400 mb-1">Next Due Date</p>
            <p className="text-sm font-bold text-[var(--color-navy)]">
              {summary.nextDue ? new Date(summary.nextDue).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
            </p>
          </div>
        </div>
      )}
      {summary && summary.totalDue > 0 && (
        <div className="mb-4 flex items-center gap-2 text-sm bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          <AlertCircle size={16} /> Outstanding ₹{summary.totalDue.toLocaleString("en-IN")} — contact Pinnacle office or call +91 99718 62138
        </div>
      )}
      <div className="space-y-3">
        {records.map(f => (
          <div key={f.id} className="card border border-slate-200">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--color-navy)] text-sm">{f.period}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total: ₹{f.amount.toLocaleString("en-IN")} · Paid: ₹{f.paidAmount.toLocaleString("en-IN")}
                  {f.amount - f.paidAmount > 0 ? ` · Due: ₹${(f.amount - f.paidAmount).toLocaleString("en-IN")}` : ""}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Due: {new Date(f.dueDate).toLocaleDateString("en-IN")}
                  {f.paidDate ? ` · Paid on: ${new Date(f.paidDate).toLocaleDateString("en-IN")}` : ""}
                  {f.paymentMethod ? ` · Mode: ${f.paymentMethod}` : ""}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${FEE_COLOR[f.status] ?? "bg-slate-100 text-slate-600"}`}>
                  {f.status}
                </span>
                {(f.status === "paid" || f.status === "partial") && (
                  <button
                    onClick={() => downloadReceipt(f.id)}
                    disabled={downloading === f.id}
                    className="flex items-center gap-1 text-xs text-[var(--color-teal)] font-medium hover:underline disabled:opacity-50"
                  >
                    <Download size={12} />
                    {downloading === f.id ? "Opening…" : "Open Receipt"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {records.length === 0 && <p className="text-slate-400 text-sm">No fee records found.</p>}
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const [section, setSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const tokenFn = useCallback(() => getToken(), [getToken]);
  const { data: meData, loading: meLoading } = useFetch<{ data: ProfileData | null }>("/portal/me", tokenFn);

  const profile = meData?.data;

  const renderSection = () => {
    if (meLoading) return <div className="text-slate-400 text-sm">Loading your profile…</div>;
    if (!profile) return <NoProfile />;
    switch (section) {
      case "overview": return <Overview profile={profile} getToken={tokenFn} />;
      case "notices": return <NoticesSection getToken={tokenFn} />;
      case "materials": return <MaterialsSection getToken={tokenFn} />;
      case "assignments": return <AssignmentsSection getToken={tokenFn} />;
      case "tests": return <MockTestsSection getToken={tokenFn} />;
      case "recordings": return <RecordingsSection getToken={tokenFn} />;
      case "doubts": return <DoubtsSection getToken={tokenFn} />;
      case "attendance": return <AttendanceSection getToken={tokenFn} />;
      case "fees": return <FeesSection getToken={tokenFn} />;
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex bg-[var(--color-slate-light)]">
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-[var(--color-navy)] flex flex-col transition-transform duration-300 top-0 lg:static lg:translate-x-0 lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-sm">S</div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Student Portal</p>
              <p className="text-white/40 text-xs truncate max-w-[120px]">{clerkUser?.firstName ?? "Student"}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {NAV.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => {
              setSection(key);
              setSidebarOpen(false);
              trackEvent("pinnacle_section_viewed", { section: key, section_label: label });
            }}
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
        <div className="lg:hidden flex items-center gap-3 bg-[var(--color-navy)] px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="text-white"><Menu size={20} /></button>
          <p className="text-white font-semibold text-sm">{NAV.find(n => n.key === section)?.label}</p>
        </div>
        <div className="p-6 max-w-4xl">{renderSection()}</div>
      </div>
    </div>
  );
}
