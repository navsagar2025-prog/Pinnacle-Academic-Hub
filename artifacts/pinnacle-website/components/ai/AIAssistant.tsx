"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Bot,
  Copy,
  Check,
  RefreshCw,
  Send,
  ChevronDown,
  Sparkles,
  FileText,
  MessageSquare,
  BookOpen,
  BarChart2,
  IndianRupee,
  Loader2,
} from "lucide-react";
import type { AiTool } from "@/lib/ai/prompts";

const MODEL_GROUPS = [
  {
    provider: "openai",
    label: "OpenAI",
    color: "#10a37f",
    models: [
      { id: "gpt-4o", label: "GPT-4o · Most Capable" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini · Fast" },
      { id: "gpt-4-turbo", label: "GPT-4 Turbo" },
    ],
  },
  {
    provider: "gemini",
    label: "Google Gemini",
    color: "#4285f4",
    models: [
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash · Fast" },
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro · Capable" },
      { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash · Daily" },
    ],
  },
  {
    provider: "anthropic",
    label: "Anthropic Claude",
    color: "#d97706",
    models: [
      { id: "claude-opus-4-5", label: "Claude Opus 4.5 · Best" },
      { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5 · Balanced" },
      { id: "claude-haiku-3-5", label: "Claude Haiku 3.5 · Fast" },
    ],
  },
  {
    provider: "openrouter",
    label: "OpenRouter",
    color: "#7c3aed",
    models: [
      { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
      { id: "mistralai/mistral-large-2411", label: "Mistral Large 2411" },
      { id: "deepseek/deepseek-r1", label: "DeepSeek R1 · Reasoning" },
    ],
  },
];

const TOOLS: { id: AiTool; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "notice_writer", label: "Notice Writer", icon: FileText, desc: "Draft official notices for the institute" },
  { id: "enquiry_responder", label: "Enquiry Responder", icon: MessageSquare, desc: "Generate counsellor replies to enquiries" },
  { id: "study_summariser", label: "Study Summariser", icon: BookOpen, desc: "Create revision summaries for students" },
  { id: "batch_insight", label: "Batch Insight", icon: BarChart2, desc: "Analyse batch performance and generate briefs" },
  { id: "fee_reminder", label: "Fee Reminder", icon: IndianRupee, desc: "Draft bilingual fee reminder messages" },
];

export interface EnquiryOption {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  courseInterest: string | null;
  message: string | null;
}

export interface BatchOption {
  id: string;
  name: string;
  courseTitle: string;
  studentCount: number;
  maxStudents: number;
  materialCount: number;
  totalFeeRecords: number;
  paidFeeRecords: number;
}

export interface OverdueStudentOption {
  studentId: string;
  studentName: string;
  rollNumber: string;
  guardianName: string | null;
  guardianPhone: string | null;
  feeRecordId: string;
  period: string;
  amount: number;
  dueDate: string;
}

export interface RecentNotice {
  title: string;
  body: string;
}

interface Props {
  enquiries: EnquiryOption[];
  batches: BatchOption[];
  overdueStudents: OverdueStudentOption[];
  recentNotices: RecentNotice[];
  userRole: "admin" | "teacher";
}

function ModelSelector({
  selected,
  onChange,
}: {
  selected: { provider: string; model: string };
  onChange: (provider: string, model: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const group = MODEL_GROUPS.find((g) => g.provider === selected.provider);
  const model = group?.models.find((m) => m.id === selected.model);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-slate-300 text-sm transition-colors min-w-[280px]"
      >
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: group?.color }}
        />
        <span className="font-medium text-slate-800 truncate">{group?.label}</span>
        <span className="text-slate-400">·</span>
        <span className="text-slate-600 truncate flex-1 text-left">{model?.label}</span>
        <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl w-80 overflow-hidden">
          {MODEL_GROUPS.map((group) => (
            <div key={group.provider}>
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{group.label}</span>
                </div>
              </div>
              {group.models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { onChange(group.provider, m.id); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 ${
                    selected.provider === group.provider && selected.model === m.id
                      ? "text-[var(--color-navy)] font-medium bg-blue-50"
                      : "text-slate-700"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OutputArea({
  output,
  streaming,
  onRetry,
}: {
  output: string;
  streaming: boolean;
  onRetry: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  if (!output && !streaming) return null;

  return (
    <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-[var(--color-teal)]" />
          <span className="text-xs font-medium text-slate-600">AI Response</span>
          {streaming && (
            <span className="flex items-center gap-1 text-xs text-[var(--color-teal)]">
              <Loader2 size={11} className="animate-spin" /> Generating…
            </span>
          )}
        </div>
        {output && !streaming && (
          <div className="flex gap-2">
            <button
              onClick={onRetry}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
            >
              <RefreshCw size={11} /> Retry
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
            >
              {copied ? <><Check size={11} className="text-green-600" /> Copied</> : <><Copy size={11} /> Copy</>}
            </button>
          </div>
        )}
      </div>
      <div className="p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto font-mono text-xs">
        {output}
        {streaming && <span className="inline-block w-1 h-4 bg-[var(--color-teal)] animate-pulse ml-0.5 align-middle" />}
      </div>
    </div>
  );
}

export default function AIAssistant({ enquiries, batches, overdueStudents, recentNotices, userRole }: Props) {
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [activeTool, setActiveTool] = useState<AiTool>("notice_writer");
  const [output, setOutput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [lastContext, setLastContext] = useState<unknown>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [noticeForm, setNoticeForm] = useState({ topic: "", tone: "Formal", audience: "All Students" });
  const [enquiryId, setEnquiryId] = useState(enquiries[0]?.id ?? "");
  const [studyForm, setStudyForm] = useState({ topic: "", concepts: "" });
  const [batchId, setBatchId] = useState(batches[0]?.id ?? "");
  const [overdueId, setOverdueId] = useState(overdueStudents[0]?.feeRecordId ?? "");

  const availableTools = TOOLS;

  const buildContext = useCallback((): unknown | null => {
    if (activeTool === "notice_writer") {
      if (!noticeForm.topic.trim()) return null;
      return { ...noticeForm, recentNotices };
    }
    if (activeTool === "enquiry_responder") {
      const enq = enquiries.find((e) => e.id === enquiryId);
      if (!enq) return null;
      return enq;
    }
    if (activeTool === "study_summariser") {
      if (!studyForm.topic.trim() || !studyForm.concepts.trim()) return null;
      return studyForm;
    }
    if (activeTool === "batch_insight") {
      const b = batches.find((b) => b.id === batchId);
      if (!b) return null;
      return {
        batchName: b.name,
        courseTitle: b.courseTitle,
        studentCount: b.studentCount,
        maxStudents: b.maxStudents,
        materialCount: b.materialCount,
        totalFeeRecords: b.totalFeeRecords,
        paidFeeRecords: b.paidFeeRecords,
      };
    }
    if (activeTool === "fee_reminder") {
      const s = overdueStudents.find((s) => s.feeRecordId === overdueId);
      if (!s) return null;
      return {
        studentName: s.studentName,
        rollNumber: s.rollNumber,
        guardianName: s.guardianName,
        guardianPhone: s.guardianPhone,
        period: s.period,
        amount: s.amount,
        dueDate: new Date(s.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
      };
    }
    return null;
  }, [activeTool, noticeForm, enquiryId, studyForm, batchId, overdueId, enquiries, batches, overdueStudents, recentNotices]);

  const generate = useCallback(async (context?: unknown) => {
    const ctx = context ?? buildContext();
    if (!ctx) return;

    if (abortRef.current) abortRef.current.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setOutput("");
    setStreaming(true);
    setLastContext(ctx);

    try {
      const res = await fetch("/pinnacle-website/api/v1/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider, model: selectedModel, tool: activeTool, context: ctx }),
        signal: abort.signal,
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "Request failed");
        setOutput(`Error: ${errText}`);
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.content) setOutput((prev) => prev + json.content);
            if (json.done) { setStreaming(false); return; }
            if (json.error) { setOutput((prev) => prev + `\n\nError: ${json.error}`); setStreaming(false); return; }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setOutput("Connection error. Please try again.");
      }
    } finally {
      setStreaming(false);
    }
  }, [selectedProvider, selectedModel, activeTool, buildContext]);

  const handleToolChange = (tool: AiTool) => {
    setActiveTool(tool);
    setOutput("");
    setLastContext(null);
    if (abortRef.current) abortRef.current.abort();
  };

  const handleModelChange = (provider: string, model: string) => {
    setSelectedProvider(provider);
    setSelectedModel(model);
    try {
      localStorage.setItem("ai_provider", provider);
      localStorage.setItem("ai_model", model);
    } catch { /* localStorage unavailable */ }
  };

  useEffect(() => {
    try {
      const savedProvider = localStorage.getItem("ai_provider");
      const savedModel = localStorage.getItem("ai_model");
      if (savedProvider && savedModel) {
        setSelectedProvider(savedProvider);
        setSelectedModel(savedModel);
      }
    } catch { /* localStorage unavailable */ }
  }, []);

  const providerColor = MODEL_GROUPS.find((g) => g.provider === selectedProvider)?.color ?? "#10a37f";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-navy)] flex items-center gap-2">
            <Bot size={24} /> AI Assistant
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Powered by Replit AI Integrations — no API key required. Usage billed to Replit credits.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border" style={{ borderColor: providerColor + "40", color: providerColor, background: providerColor + "10" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: providerColor }} />
            {MODEL_GROUPS.find((g) => g.provider === selectedProvider)?.label}
          </span>
          <ModelSelector
            selected={{ provider: selectedProvider, model: selectedModel }}
            onChange={handleModelChange}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {availableTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => handleToolChange(tool.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTool === tool.id
                  ? "bg-[var(--color-navy)] text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800"
              }`}
            >
              <Icon size={14} />
              {tool.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        {activeTool === "notice_writer" && (
          <NoticeWriterForm
            form={noticeForm}
            onChange={setNoticeForm}
            onSubmit={() => generate()}
            loading={streaming}
          />
        )}
        {activeTool === "enquiry_responder" && (
          <EnquiryResponderForm
            enquiries={enquiries}
            selected={enquiryId}
            onChange={setEnquiryId}
            onSubmit={() => generate()}
            loading={streaming}
          />
        )}
        {activeTool === "study_summariser" && (
          <StudySummariserForm
            form={studyForm}
            onChange={setStudyForm}
            onSubmit={() => generate()}
            loading={streaming}
          />
        )}
        {activeTool === "batch_insight" && (
          <BatchInsightForm
            batches={batches}
            selected={batchId}
            onChange={setBatchId}
            onSubmit={() => generate()}
            loading={streaming}
          />
        )}
        {activeTool === "fee_reminder" && (
          <FeeReminderForm
            students={overdueStudents}
            selected={overdueId}
            onChange={setOverdueId}
            onSubmit={() => generate()}
            loading={streaming}
          />
        )}

        <OutputArea
          output={output}
          streaming={streaming}
          onRetry={() => generate(lastContext)}
        />
      </div>
    </div>
  );
}

function SubmitButton({ loading, label = "Generate" }: { loading: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-navy)] text-white text-sm font-medium rounded-xl hover:bg-[var(--color-navy)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
      {loading ? "Generating…" : label}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700 mb-1">{children}</label>;
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-slate-400 mt-1">{children}</p>;
}

function NoticeWriterForm({
  form,
  onChange,
  onSubmit,
  loading,
}: {
  form: { topic: string; tone: string; audience: string };
  onChange: (v: { topic: string; tone: string; audience: string }) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <p className="text-sm text-slate-500 mb-4">Draft a formal notice ready to publish on the notice board.</p>
      <div>
        <Label>Notice Topic *</Label>
        <input
          type="text"
          value={form.topic}
          onChange={(e) => onChange({ ...form, topic: e.target.value })}
          placeholder="e.g. Annual Exam Schedule 2025, Fee Submission Reminder, Holiday Notice"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-teal)] transition-colors"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tone</Label>
          <select
            value={form.tone}
            onChange={(e) => onChange({ ...form, tone: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-teal)] transition-colors"
          >
            {["Formal", "Friendly", "Urgent", "Informational"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <Label>Target Audience</Label>
          <select
            value={form.audience}
            onChange={(e) => onChange({ ...form, audience: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-teal)] transition-colors"
          >
            {["All Students", "JEE Students", "NEET Students", "Foundation Students", "All Parents", "Teachers", "All Staff"].map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
      </div>
      <SubmitButton loading={loading} label="Draft Notice" />
    </form>
  );
}

function EnquiryResponderForm({
  enquiries,
  selected,
  onChange,
  onSubmit,
  loading,
}: {
  enquiries: EnquiryOption[];
  selected: string;
  onChange: (id: string) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const enq = enquiries.find((e) => e.id === selected);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <p className="text-sm text-slate-500 mb-4">Generate a warm, professional reply to an open student enquiry.</p>
      {enquiries.length === 0 ? (
        <div className="text-sm text-slate-400 text-center py-8 border border-dashed border-slate-200 rounded-xl">No open enquiries found in the database.</div>
      ) : (
        <>
          <div>
            <Label>Select Enquiry</Label>
            <select
              value={selected}
              onChange={(e) => onChange(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-teal)] transition-colors"
            >
              {enquiries.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} — {e.courseInterest ?? "General"} ({e.phone})
                </option>
              ))}
            </select>
          </div>
          {enq && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm space-y-1">
              <div><span className="font-medium text-slate-600">Name:</span> <span className="text-slate-800">{enq.name}</span></div>
              <div><span className="font-medium text-slate-600">Phone:</span> <span className="text-slate-800">{enq.phone}</span></div>
              {enq.email && <div><span className="font-medium text-slate-600">Email:</span> <span className="text-slate-800">{enq.email}</span></div>}
              {enq.courseInterest && <div><span className="font-medium text-slate-600">Interest:</span> <span className="text-slate-800">{enq.courseInterest}</span></div>}
              {enq.message && <div><span className="font-medium text-slate-600">Message:</span> <span className="text-slate-800 italic">{enq.message}</span></div>}
            </div>
          )}
          <SubmitButton loading={loading} label="Draft Reply" />
        </>
      )}
    </form>
  );
}

function StudySummariserForm({
  form,
  onChange,
  onSubmit,
  loading,
}: {
  form: { topic: string; concepts: string };
  onChange: (v: { topic: string; concepts: string }) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <p className="text-sm text-slate-500 mb-4">Generate a structured revision summary suitable for JEE/NEET/Foundation students.</p>
      <div>
        <Label>Topic Name *</Label>
        <input
          type="text"
          value={form.topic}
          onChange={(e) => onChange({ ...form, topic: e.target.value })}
          placeholder="e.g. Newton's Laws of Motion, Chemical Bonding, Quadratic Equations"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-teal)] transition-colors"
          required
        />
      </div>
      <div>
        <Label>Key Concepts to Cover *</Label>
        <textarea
          value={form.concepts}
          onChange={(e) => onChange({ ...form, concepts: e.target.value })}
          placeholder="e.g. First law (inertia), Second law (F=ma), Third law (action-reaction), applications, common mistakes"
          rows={3}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-teal)] transition-colors resize-none"
          required
        />
        <Hint>Separate concepts with commas. The more specific, the better the summary.</Hint>
      </div>
      <SubmitButton loading={loading} label="Generate Summary" />
    </form>
  );
}

function BatchInsightForm({
  batches,
  selected,
  onChange,
  onSubmit,
  loading,
}: {
  batches: BatchOption[];
  selected: string;
  onChange: (id: string) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const batch = batches.find((b) => b.id === selected);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <p className="text-sm text-slate-500 mb-4">AI analyses batch data and writes a 2-paragraph performance brief for management.</p>
      {batches.length === 0 ? (
        <div className="text-sm text-slate-400 text-center py-8 border border-dashed border-slate-200 rounded-xl">No batches found in the database.</div>
      ) : (
        <>
          <div>
            <Label>Select Batch</Label>
            <select
              value={selected}
              onChange={(e) => onChange(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-teal)] transition-colors"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name} — {b.courseTitle}</option>
              ))}
            </select>
          </div>
          {batch && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Students", value: `${batch.studentCount}/${batch.maxStudents}` },
                { label: "Materials", value: batch.materialCount.toString() },
                { label: "Fee Records", value: `${batch.paidFeeRecords}/${batch.totalFeeRecords} paid` },
                { label: "Collection", value: batch.totalFeeRecords > 0 ? `${Math.round((batch.paidFeeRecords / batch.totalFeeRecords) * 100)}%` : "N/A" },
              ].map((stat) => (
                <div key={stat.label} className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500 mb-0.5">{stat.label}</div>
                  <div className="text-sm font-semibold text-slate-800">{stat.value}</div>
                </div>
              ))}
            </div>
          )}
          <SubmitButton loading={loading} label="Generate Brief" />
        </>
      )}
    </form>
  );
}

function FeeReminderForm({
  students,
  selected,
  onChange,
  onSubmit,
  loading,
}: {
  students: OverdueStudentOption[];
  selected: string;
  onChange: (id: string) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const student = students.find((s) => s.feeRecordId === selected);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <p className="text-sm text-slate-500 mb-4">Draft a polite bilingual (English + Hindi) fee reminder for an overdue student.</p>
      {students.length === 0 ? (
        <div className="text-sm text-slate-400 text-center py-8 border border-dashed border-slate-200 rounded-xl">No overdue fee records found. All students are up to date!</div>
      ) : (
        <>
          <div>
            <Label>Select Overdue Student</Label>
            <select
              value={selected}
              onChange={(e) => onChange(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-teal)] transition-colors"
            >
              {students.map((s) => (
                <option key={s.feeRecordId} value={s.feeRecordId}>
                  {s.studentName} ({s.rollNumber}) — {s.period} — ₹{s.amount.toLocaleString("en-IN")}
                </option>
              ))}
            </select>
          </div>
          {student && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm space-y-1">
              <div><span className="font-medium text-slate-600">Student:</span> <span className="text-slate-800">{student.studentName} (Roll: {student.rollNumber})</span></div>
              {student.guardianName && <div><span className="font-medium text-slate-600">Guardian:</span> <span className="text-slate-800">{student.guardianName} {student.guardianPhone && `(${student.guardianPhone})`}</span></div>}
              <div><span className="font-medium text-slate-600">Period:</span> <span className="text-slate-800">{student.period}</span></div>
              <div><span className="font-medium text-red-600 font-semibold">Amount Due: ₹{student.amount.toLocaleString("en-IN")}</span></div>
              <div><span className="font-medium text-slate-600">Due Date:</span> <span className="text-red-700">{new Date(student.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</span></div>
            </div>
          )}
          <SubmitButton loading={loading} label="Draft Reminder" />
        </>
      )}
    </form>
  );
}
