"use client";
import { useState } from "react";

type Item = {
  id: string;
  title: string;
  caption: string | null;
  category: string;
  imageUrl: string;
};

const FALLBACK_GRADIENT: Record<string, string> = {
  "Classrooms": "from-[var(--color-navy)] to-blue-700",
  "Events": "from-[var(--color-teal)] to-teal-700",
  "Mock Tests": "from-slate-700 to-slate-900",
  "Toppers' Celebration": "from-amber-500 to-amber-700",
  "Campus": "from-[var(--color-maroon)] to-red-800",
  "Faculty": "from-violet-700 to-purple-900",
  "Infrastructure": "from-green-700 to-emerald-800",
  "General": "from-[var(--color-navy)] to-slate-700",
};

export function GalleryGrid({ items }: { items: Item[] }) {
  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category)))];
  const [active, setActive] = useState("All");

  const filtered = active === "All" ? items : items.filter((i) => i.category === active);

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap justify-center mb-10">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              c === active
                ? "bg-[var(--color-navy)] text-white"
                : "bg-[var(--color-slate-light)] text-slate-600 hover:bg-[var(--color-navy)]/10 hover:text-[var(--color-navy)]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p>No photos in this category yet.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {filtered.map((item, i) => {
            const gradient = FALLBACK_GRADIENT[item.category] ?? "from-[var(--color-navy)] to-slate-700";
            return (
              <div
                key={item.id}
                className={`break-inside-avoid rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer group ${
                  i % 3 === 0 ? "aspect-square" : i % 3 === 1 ? "aspect-[4/3]" : "aspect-[3/4]"
                }`}
              >
                {item.imageUrl ? (
                  <div className="relative w-full h-full">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <div className="text-white text-xs font-semibold line-clamp-2">{item.title}</div>
                      {item.caption && <div className="text-white/60 text-xs mt-0.5 line-clamp-1">{item.caption}</div>}
                      <div className="text-white/50 text-xs">{item.category}</div>
                    </div>
                  </div>
                ) : (
                  <div className={`bg-gradient-to-br ${gradient} w-full h-full min-h-[160px] flex flex-col items-center justify-center p-4 relative`}>
                    <div className="text-5xl mb-3">📷</div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm p-3">
                      <div className="text-white text-xs font-semibold">{item.title}</div>
                      <div className="text-white/60 text-xs mt-0.5">{item.category}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
