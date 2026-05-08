"use client";

import { useMemo, useState } from "react";
import {
  Plus, Save, X, Trash2, ArrowUpRight, Eye, EyeOff,
  AlertCircle, CheckCircle2, RotateCcw,
} from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

type Provider = "zoom" | "youtube" | "vimeo" | "mp4" | "hls" | "other";
const PROVIDERS: Provider[] = ["zoom", "youtube", "vimeo", "mp4", "hls", "other"];

interface Row {
  id: string;
  title: string;
  subject: string;
  teacherName: string | null;
  recordingUrl: string;
  sourceProvider: string | null;
  classDate: string | null;
  durationMinutes: number | null;
  isVisible: boolean | null;
  viewCount: number | null;
  archivedAt: string | null;
  createdAt: string;
  batchId: string | null;
  batchName: string | null;
  createdByName: string | null;
}

interface FormState {
  title: string;
  subject: string;
  teacherName: string;
  recordingUrl: string;
  sourceProvider: Provider;
  classDate: string;
  durationMinutes: string;
  batchId: string;
  isVisible: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  subject: "Physics",
  teacherName: "",
  recordingUrl: "",
  sourceProvider: "zoom",
  classDate: "",
  durationMinutes: "",
  batchId: "",
  isVisible: true,
};

export function AdminRecordingsManager({
  initialRows,
  batches,
}: {
  initialRows: Row[];
  batches: { id: string; name: string }[];
}) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [filterArchived, setFilterArchived] = useState(false);

  const visibleRows = useMemo(
    () => rows.filter((r) => (filterArchived ? !!r.archivedAt : !r.archivedAt)),
    [rows, filterArchived],
  );

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setFeedback(null);
  }

  function openEdit(r: Row) {
    setEditingId(r.id);
    setForm({
      title: r.title,
      subject: r.subject,
      teacherName: r.teacherName ?? "",
      recordingUrl: r.recordingUrl,
      sourceProvider: ((PROVIDERS as readonly string[]).includes(r.sourceProvider ?? "")
        ? (r.sourceProvider as Provider)
        : "zoom"),
      classDate: r.classDate ? r.classDate.slice(0, 10) : "",
      durationMinutes: r.durationMinutes ? String(r.durationMinutes) : "",
      batchId: r.batchId ?? "",
      isVisible: r.isVisible ?? true,
    });
    setShowForm(true);
    setFeedback(null);
  }

  async function save() {
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        title: form.title.trim(),
        subject: form.subject.trim(),
        teacherName: form.teacherName.trim() || null,
        recordingUrl: form.recordingUrl.trim(),
        sourceProvider: form.sourceProvider,
        classDate: form.classDate || null,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
        batchId: form.batchId || null,
        isVisible: form.isVisible,
      };
      const url = editingId ? `${BASE}/api/v1/recordings/${editingId}` : `${BASE}/api/v1/recordings`;
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Save failed");
      const saved = json.data as Row & { batchId: string | null };
      const enriched: Row = {
        ...saved,
        batchName: batches.find((b) => b.id === saved.batchId)?.name ?? null,
        createdByName: editingId
          ? rows.find((r) => r.id === editingId)?.createdByName ?? null
          : null,
        classDate: typeof saved.classDate === "string" ? saved.classDate : null,
        archivedAt: typeof saved.archivedAt === "string" ? saved.archivedAt : null,
        createdAt: typeof saved.createdAt === "string" ? saved.createdAt : new Date().toISOString(),
      };
      setRows((rs) => {
        if (editingId) return rs.map((r) => (r.id === editingId ? enriched : r));
        return [enriched, ...rs];
      });
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      setFeedback({ ok: true, msg: editingId ? "Recording updated." : "Recording added." });
    } catch (e) {
      setFeedback({ ok: false, msg: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  async function archive(id: string, archived: boolean) {
    setFeedback(null);
    try {
      const res = archived
        ? await fetch(`${BASE}/api/v1/recordings/${id}`, { method: "DELETE" })
        : await fetch(`${BASE}/api/v1/recordings/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ archived: false, isVisible: true }),
          });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Update failed");
      setRows((rs) =>
        rs.map((r) =>
          r.id === id
            ? {
                ...r,
                archivedAt: archived ? new Date().toISOString() : null,
                isVisible: archived ? false : true,
              }
            : r,
        ),
      );
      setFeedback({ ok: true, msg: archived ? "Recording archived." : "Recording restored." });
    } catch (e) {
      setFeedback({ ok: false, msg: e instanceof Error ? e.message : "Update failed" });
    }
  }

  async function toggleVisible(r: Row) {
    setFeedback(null);
    try {
      const res = await fetch(`${BASE}/api/v1/recordings/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !r.isVisible }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Update failed");
      setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, isVisible: !r.isVisible } : x)));
    } catch (e) {
      setFeedback({ ok: false, msg: e instanceof Error ? e.message : "Update failed" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterArchived(false)}
            className={`text-xs px-3 py-1.5 rounded-full border ${!filterArchived ? "bg-[var(--color-navy)] text-white border-[var(--color-navy)]" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setFilterArchived(true)}
            className={`text-xs px-3 py-1.5 rounded-full border ${filterArchived ? "bg-[var(--color-navy)] text-white border-[var(--color-navy)]" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
          >
            Archived
          </button>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
        >
          <Plus size={15} /> Add recording
        </button>
      </div>

      {feedback && (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${feedback.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {feedback.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {feedback.msg}
        </div>
      )}

      {showForm && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[var(--color-navy)]">
              {editingId ? "Edit recording" : "Add recording"}
            </h2>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block md:col-span-2">
              <span className="text-xs font-semibold text-slate-600">Title *</span>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Newton's Laws — Class 11 — 12 May"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Subject *</span>
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {["Physics", "Chemistry", "Mathematics", "Biology", "Other"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Teacher</span>
              <input
                value={form.teacherName}
                onChange={(e) => setForm({ ...form, teacherName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Mr Sharma"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs font-semibold text-slate-600">Source URL * (Zoom share, MP4, HLS, etc.)</span>
              <input
                value={form.recordingUrl}
                onChange={(e) => setForm({ ...form, recordingUrl: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
                placeholder="https://us02web.zoom.us/rec/share/..."
              />
              <p className="text-[11px] text-slate-500 mt-1">
                This URL is never sent to the browser. It is only used by the signed stream proxy after access is verified.
              </p>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Source provider</span>
              <select
                value={form.sourceProvider}
                onChange={(e) => setForm({ ...form, sourceProvider: e.target.value as Provider })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Batch *</span>
              <select
                value={form.batchId}
                onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">— Select batch —</option>
                {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Class date</span>
              <input
                type="date"
                value={form.classDate}
                onChange={(e) => setForm({ ...form, classDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Duration (minutes)</span>
              <input
                type="number"
                min={0}
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="90"
              />
            </label>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={form.isVisible}
                onChange={(e) => setForm({ ...form, isVisible: e.target.checked })}
              />
              <span>Visible to students</span>
            </label>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving || !form.title || !form.subject || !form.recordingUrl}
              className="btn-primary py-2 px-4 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={15} /> {saving ? "Saving…" : editingId ? "Update" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
              className="btn-secondary py-2 px-4 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Batch</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Source</th>
              <th className="text-left px-4 py-3">Views</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-slate-400">No recordings.</td></tr>
            )}
            {visibleRows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <div className="font-semibold text-[var(--color-navy)]">{r.title}</div>
                  <div className="text-xs text-slate-500">{r.subject}{r.teacherName ? ` · ${r.teacherName}` : ""}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{r.batchName ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">
                  {r.classDate
                    ? new Date(r.classDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{r.sourceProvider ?? "zoom"}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{r.viewCount ?? 0}</td>
                <td className="px-4 py-3 text-xs">
                  {r.archivedAt ? (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Archived</span>
                  ) : r.isVisible ? (
                    <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700">Live</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Hidden</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    {!r.archivedAt && (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleVisible(r)}
                          title={r.isVisible ? "Hide from students" : "Show to students"}
                          className="text-slate-500 hover:text-[var(--color-navy)]"
                        >
                          {r.isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          className="text-xs px-2 py-1 rounded border border-slate-200 hover:border-slate-400"
                        >
                          Edit
                        </button>
                        <a
                          href={`${BASE}/portal/student/recordings/${r.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[var(--color-teal)] hover:underline inline-flex items-center gap-1"
                          title="Preview as student"
                        >
                          Preview <ArrowUpRight size={11} />
                        </a>
                        <button
                          type="button"
                          onClick={() => archive(r.id, true)}
                          title="Archive"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                    {r.archivedAt && (
                      <button
                        type="button"
                        onClick={() => archive(r.id, false)}
                        className="text-xs px-2 py-1 rounded border border-slate-200 hover:border-slate-400 inline-flex items-center gap-1"
                      >
                        <RotateCcw size={12} /> Restore
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
