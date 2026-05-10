import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { Camera, X } from "lucide-react";

type GalleryItem = {
  id: string;
  title: string;
  caption: string | null;
  category: string | null;
  imageUrl: string;
  sortOrder: number | null;
};

const CATEGORIES = ["All", "Classroom", "Events", "Results", "Campus", "Faculty"];

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/v1/gallery`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setItems(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeCategory === "All" ? items : items.filter((i) => i.category === activeCategory);

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-[var(--color-navy)] py-14">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <span className="badge-gold mb-4 inline-block">Campus Life</span>
            <h1 className="font-[family-name:var(--font-playfair)] text-white text-4xl md:text-5xl font-bold">Our Gallery</h1>
            <p className="text-white/70 text-lg mt-4">
              A glimpse into the learning environment, events, and milestones at Pinnacle Academic Classes.
            </p>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            {!loading && items.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8 justify-center">
                {CATEGORIES.filter((c) => c === "All" || items.some((i) => i.category === c)).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === cat ? "bg-[var(--color-navy)] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-square bg-slate-200 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <Camera size={48} className="mx-auto mb-4 opacity-30" />
                <p className="font-semibold text-slate-500">Gallery coming soon</p>
                <p className="text-sm mt-2">Photos will appear here once uploaded by the admin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal)]"
                  >
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-3 opacity-0 group-hover:opacity-100">
                      <p className="text-white text-xs font-semibold text-left line-clamp-2">{item.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute -top-10 right-0 text-white hover:text-[var(--color-gold)] transition-colors">
              <X size={24} />
            </button>
            <img src={selected.imageUrl} alt={selected.title} className="w-full rounded-xl object-contain max-h-[80vh]" />
            {(selected.title || selected.caption) && (
              <div className="mt-3 text-center">
                <p className="text-white font-semibold">{selected.title}</p>
                {selected.caption && <p className="text-white/70 text-sm mt-1">{selected.caption}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
      <WhatsAppButton />
    </>
  );
}
