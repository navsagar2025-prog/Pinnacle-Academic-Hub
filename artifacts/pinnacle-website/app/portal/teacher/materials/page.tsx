"use client";

import { useState } from "react";
import { FileText, Upload, Trash2, Calendar } from "lucide-react";

const UPLOADED = [
  { id: 1, title: "Wave Optics — Complete Notes", type: "Notes", date: "25 Apr 2026", downloads: 47, batch: "JEE 2026" },
  { id: 2, title: "Thermodynamics — Revision Sheet", type: "Summary", date: "20 Apr 2026", downloads: 62, batch: "JEE 2026" },
  { id: 3, title: "Electrostatics — Problem Set", type: "Exercise", date: "15 Apr 2026", downloads: 38, batch: "JEE 2026" },
  { id: 4, title: "Modern Physics — Formula Sheet", type: "Formula", date: "10 Apr 2026", downloads: 55, batch: "JEE 2026" },
];

export default function TeacherMaterialsPage() {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Study Materials</h1>
        <p className="text-slate-500 text-sm mt-1">Upload and manage your study material for students</p>
      </div>

      {/* Upload */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${dragOver ? "border-[var(--color-teal)] bg-[var(--color-teal)]/5" : "border-slate-200 hover:border-[var(--color-teal)]/50 hover:bg-[var(--color-slate-light)]"}`}
      >
        <Upload size={32} className="text-slate-400 mx-auto mb-3" />
        <div className="font-semibold text-[var(--color-navy)] mb-1">Upload Study Material</div>
        <p className="text-slate-500 text-sm">Drag & drop PDF, Word, or image files here, or click to browse</p>
        <button className="btn-secondary mt-4 py-2 px-6 text-sm">Browse Files</button>
      </div>

      {/* List */}
      <div className="card">
        <h2 className="font-bold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">Uploaded Materials</h2>
        <div className="divide-y divide-slate-100">
          {UPLOADED.map((m) => (
            <div key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-4 py-3">
              <div className="w-10 h-10 bg-[var(--color-navy)]/5 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-[var(--color-navy)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-[var(--color-navy)]">{m.title}</div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                  <span className="badge text-xs bg-slate-100 text-slate-600">{m.type}</span>
                  <span className="flex items-center gap-1"><Calendar size={10} />{m.date}</span>
                  <span>{m.downloads} downloads</span>
                </div>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[var(--color-maroon)] hover:bg-[var(--color-maroon)]/5 text-xs font-semibold transition-colors">
                <Trash2 size={13} />Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
