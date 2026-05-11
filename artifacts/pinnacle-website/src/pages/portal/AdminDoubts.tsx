import { useState, useEffect, useCallback } from "react";
import { X, CheckCircle, MessageCircle, RefreshCw } from "lucide-react";
import { useToast, SkeletonList, useModalEscape, apiMutation } from "./portalUtils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Doubt = { id: string; subject: string; topic: string | null; questionText: string; isResolved: boolean; answerCount: number; batchId: string | null; batchName: string | null; studentId: string; studentName: string | null; createdAt: string };
type DoubtDetail = Doubt & { answers: { id: string; answerText: string; authorRole: string; isOfficial: boolean; createdAt: string }[] };

function useDoubts(resolved: boolean, getToken: () => Promise<string | null>) {
  const [data, setData] = useState<Doubt[] | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/v1/admin/doubts?resolved=${resolved}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json(); setData(json.data);
    } finally { setLoading(false); }
  }, [resolved]);
  useEffect(() => { load(); }, [load]);
  return { data, loading, reload: load };
}

export function AdminDoubts({ getToken }: { getToken: () => Promise<string | null> }) {
  const { toast } = useToast();
  const [tab, setTab] = useState<"open" | "resolved">("open");
  const { data: doubts, loading, reload } = useDoubts(tab === "resolved", getToken);
  const [selected, setSelected] = useState<DoubtDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [answering, setAnswering] = useState(false);

  useModalEscape(() => setSelected(null), !!selected);

  const openDetail = async (d: Doubt) => {
    setDetailLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/v1/admin/doubts/${d.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setSelected(json.data);
      setAnswerText("");
    } finally { setDetailLoading(false); }
  };

  const markResolved = async (id: string) => {
    const res = await apiMutation("PATCH", `/admin/doubts/${id}`, { isResolved: true, status: "resolved" }, getToken);
    if (res.ok) { toast("success", "Marked as resolved"); setSelected(null); reload(); }
    else toast("error", "Update failed");
  };

  const postAnswer = async () => {
    if (!answerText.trim() || !selected) return;
    setAnswering(true);
    try {
      const res = await apiMutation("POST", `/admin/doubts/${selected.id}/answer`, { answerText, isOfficial: true }, getToken);
      if (res.ok) { toast("success", "Answer posted"); openDetail(selected); }
      else toast("error", "Failed to post answer");
    } catch { toast("error", "Network error"); }
    finally { setAnswering(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--color-navy)]">Doubts / Q&A</h2>
        <button onClick={reload} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[var(--color-navy)]"><RefreshCw size={14} /> Refresh</button>
      </div>

      <div className="flex gap-2 mb-4">
        {(["open", "resolved"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === t ? "bg-[var(--color-navy)] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {t === "open" ? "Open" : "Resolved"}
          </button>
        ))}
      </div>

      {loading && <SkeletonList rows={5} />}
      <div className="space-y-2">
        {(doubts ?? []).map(d => (
          <button key={d.id} onClick={() => openDetail(d)} className="w-full text-left card border border-slate-200 hover:border-[var(--color-teal)]/40 transition-colors">
            <div className="flex gap-3 items-start">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-1.5 mb-1">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{d.subject}</span>
                  {d.topic && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{d.topic}</span>}
                  {d.batchName && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{d.batchName}</span>}
                </div>
                <p className="text-sm text-[var(--color-navy)] line-clamp-2">{d.questionText}</p>
                <p className="text-xs text-slate-400 mt-1">{d.studentName ?? "Student"} · {new Date(d.createdAt).toLocaleDateString("en-IN")}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="flex items-center gap-1 text-xs text-slate-400"><MessageCircle size={12} />{d.answerCount}</span>
                {d.isResolved && <CheckCircle size={14} className="text-green-500" />}
              </div>
            </div>
          </button>
        ))}
        {(doubts ?? []).length === 0 && !loading && (
          <p className="text-slate-400 text-sm text-center py-8">No {tab} doubts.</p>
        )}
        {detailLoading && <div className="text-slate-400 text-sm text-center py-4">Loading doubt…</div>}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white">
              <div>
                <h3 className="font-bold text-[var(--color-navy)]">Doubt Detail</h3>
                <p className="text-xs text-slate-500">{selected.studentName ?? "Student"} · {selected.subject}{selected.topic && ` · ${selected.topic}`}</p>
              </div>
              <button onClick={() => setSelected(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="p-5">
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-slate-800">{selected.questionText}</p>
              </div>

              <h4 className="font-semibold text-xs text-slate-500 uppercase tracking-wide mb-3">Answers ({selected.answers.length})</h4>
              <div className="space-y-3 mb-5">
                {selected.answers.map(a => (
                  <div key={a.id} className={`p-3 rounded-xl text-sm ${a.isOfficial ? "bg-teal-50 border border-teal-100" : "bg-white border border-slate-200"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-600 capitalize">{a.authorRole}</span>
                      {a.isOfficial && <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">Official</span>}
                      <span className="text-xs text-slate-400 ml-auto">{new Date(a.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                    <p className="text-slate-700">{a.answerText}</p>
                  </div>
                ))}
                {selected.answers.length === 0 && <p className="text-slate-400 text-sm">No answers yet.</p>}
              </div>

              <div className="space-y-3">
                <textarea rows={3} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none" placeholder="Post an official answer…" value={answerText} onChange={e => setAnswerText(e.target.value)} />
                <div className="flex gap-2 justify-between">
                  {!selected.isResolved && (
                    <button onClick={() => markResolved(selected.id)} className="flex items-center gap-1.5 px-3 py-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100">
                      <CheckCircle size={14} /> Mark Resolved
                    </button>
                  )}
                  <button onClick={postAnswer} disabled={answering || !answerText.trim()} className="ml-auto btn-primary px-4 py-2 text-sm disabled:opacity-50">
                    {answering ? "Posting…" : "Post Answer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
