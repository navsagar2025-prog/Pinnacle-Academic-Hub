"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "bg-slate-100 text-slate-600" },
  { value: "contacted", label: "Contacted", color: "bg-blue-100 text-blue-700" },
  { value: "interested", label: "Interested", color: "bg-[var(--color-gold)]/15 text-[var(--color-navy)]" },
  { value: "converted", label: "Converted", color: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]" },
  { value: "declined", label: "Declined", color: "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]" },
];

export function AdmissionStatusDropdown({ enquiryId, current }: { enquiryId: string; current: string }) {
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [loading, setLoading] = useState(false);

  async function handleChange(newVal: string) {
    setValue(newVal);
    setLoading(true);
    await fetch(`${BASE}/api/v1/enquiries/${enquiryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admissionStatus: newVal }),
    });
    setLoading(false);
    router.refresh();
  }

  const opt = STATUS_OPTIONS.find((o) => o.value === value);

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        className={`badge text-xs cursor-pointer border-0 pr-6 appearance-none focus:outline-none ${opt?.color ?? "bg-slate-100 text-slate-600"}`}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {loading && <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">…</span>}
    </div>
  );
}

export function AdmissionNotesEditor({ enquiryId, currentNotes }: { enquiryId: string; currentNotes: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(currentNotes ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`${BASE}/api/v1/enquiries/${enquiryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  function cancel() {
    setNotes(currentNotes ?? "");
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex items-start gap-1 group min-w-[140px] max-w-[200px]">
        <span className="text-xs text-slate-500 italic flex-1 line-clamp-2">
          {notes || <span className="text-slate-300">No notes</span>}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-[var(--color-teal)] flex-shrink-0 mt-0.5"
          title="Edit notes"
        >
          <Pencil size={11} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[180px]">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        autoFocus
        className="w-full text-xs border border-[var(--color-teal)] rounded-lg px-2 py-1.5 focus:outline-none resize-none"
        placeholder="Add internal notes…"
      />
      <div className="flex gap-1">
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1 text-xs bg-[var(--color-teal)] text-white rounded-md py-1 hover:opacity-90 disabled:opacity-50"
        >
          <Check size={11} />{saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={cancel}
          className="flex-1 flex items-center justify-center gap-1 text-xs border border-slate-200 text-slate-500 rounded-md py-1 hover:bg-slate-50"
        >
          <X size={11} />Cancel
        </button>
      </div>
    </div>
  );
}
