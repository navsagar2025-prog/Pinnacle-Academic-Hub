"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MessageSquare, CheckCircle, Clock, Phone, Mail, Download, Search, Filter, X } from "lucide-react";
import { apiUrl } from "@/lib/utils";

interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  courseInterest: string | null;
  message: string | null;
  source: string | null;
  isFollowedUp: boolean | null;
  admissionStatus: string | null;
  notes: string | null;
  createdAt: Date;
}

interface Props {
  rows: Enquiry[];
  total: number;
  pending: number;
  initialKeyword?: string;
  initialStatus?: string;
  initialFrom?: string;
  initialTo?: string;
}

export default function EnquiriesClient({ rows, total, pending, initialKeyword = "", initialStatus = "", initialFrom = "", initialTo = "" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [keyword, setKeyword] = useState(initialKeyword);
  const [status, setStatus] = useState(initialStatus);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  function applyFilters(overrides?: { keyword?: string; status?: string; from?: string; to?: string }) {
    const kw = overrides?.keyword ?? keyword;
    const st = overrides?.status ?? status;
    const fr = overrides?.from ?? from;
    const t = overrides?.to ?? to;
    const params = new URLSearchParams();
    if (kw) params.set("keyword", kw);
    if (st) params.set("status", st);
    if (fr) params.set("from", fr);
    if (t) params.set("to", t);
    router.push(`${pathname}${params.size > 0 ? `?${params}` : ""}`);
  }

  function clearFilters() {
    setKeyword("");
    setStatus("");
    setFrom("");
    setTo("");
    router.push(pathname);
  }

  function buildExportUrl() {
    const base = apiUrl("/api/v1/enquiries/export");
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return `${base}${params.size > 0 ? `?${params}` : ""}`;
  }

  const hasActiveFilters = keyword || status || from || to;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Enquiries</h1>
          <p className="text-slate-500 text-sm mt-1">{total} total · {pending} pending follow-up</p>
        </div>
        <a
          href={buildExportUrl()}
          download
          className="inline-flex items-center gap-2 btn-secondary py-2.5 px-4 text-sm whitespace-nowrap"
        >
          <Download size={14} /> Export CSV{hasActiveFilters ? " (filtered)" : ""}
        </a>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Enquiries", value: total, color: "navy" },
          { label: "Pending Follow-up", value: pending, color: "gold" },
          { label: "Followed Up", value: total - pending, color: "teal" },
        ].map((s) => (
          <div key={s.label} className={`card border-l-4 ${s.color === "navy" ? "border-l-[var(--color-navy)]" : s.color === "gold" ? "border-l-[var(--color-gold)]" : "border-l-[var(--color-teal)]"}`}>
            <div className="text-2xl font-bold font-[family-name:var(--font-playfair)] text-[var(--color-navy)]">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filter &amp; Export</span>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="ml-auto text-xs text-slate-400 hover:text-[var(--color-maroon)] flex items-center gap-1">
              <X size={11} /> Clear filters
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              placeholder="Name, phone, email, course…"
              className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
            />
          </div>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] text-slate-600"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending follow-up</option>
            <option value="done">Followed up</option>
          </select>

          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); applyFilters({ from: e.target.value }); }}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] text-slate-600"
            placeholder="From date"
          />

          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); applyFilters({ to: e.target.value }); }}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)] text-slate-600"
            placeholder="To date"
          />
        </div>

        <button
          onClick={() => applyFilters()}
          className="mt-3 btn-primary text-sm py-2 px-4"
        >
          Apply Filters
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
          <p>{hasActiveFilters ? "No enquiries match your filters." : "No enquiries yet. They will appear here when visitors fill the contact form."}</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-slate-light)] border-b border-slate-100">
                <tr>
                  {["Name", "Contact", "Course Interest", "Message", "Date", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((e) => (
                  <tr key={e.id} className="hover:bg-[var(--color-slate-light)]/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[var(--color-navy)]/10 rounded-full flex items-center justify-center text-[var(--color-navy)] text-xs font-bold flex-shrink-0">
                          {e.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-sm text-[var(--color-navy)] whitespace-nowrap">{e.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600"><Phone size={11} />{e.phone}</div>
                        {e.email && <div className="flex items-center gap-1.5 text-xs text-slate-400"><Mail size={11} />{e.email}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{e.courseInterest ?? "General"}</td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-xs text-slate-500 line-clamp-2">{e.message ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(e.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs flex items-center gap-1 w-fit ${e.isFollowedUp ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)]" : "bg-[var(--color-gold)]/15 text-[var(--color-navy)]"}`}>
                        {e.isFollowedUp ? <CheckCircle size={11} /> : <Clock size={11} />}
                        {e.isFollowedUp ? "Done" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
