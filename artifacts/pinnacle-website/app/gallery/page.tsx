import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";

export const metadata = {
  title: "Gallery — Pinnacle Academic Classes",
  description: "Photos from classrooms, events, mock tests, and celebrations at Pinnacle Academic Classes, Greater Noida.",
};

const CATEGORIES = ["All", "Classrooms", "Events", "Mock Tests", "Toppers' Celebration", "Campus"];

const GALLERY_ITEMS = [
  { id: 1, category: "Classrooms", label: "Physics Lab — Wave Optics Session", color: "from-[var(--color-navy)] to-blue-700", icon: "⚡" },
  { id: 2, category: "Events", label: "Annual Science Exhibition 2025", color: "from-[var(--color-teal)] to-teal-700", icon: "🔬" },
  { id: 3, category: "Mock Tests", label: "JEE Full-Length Mock Test #6", color: "from-slate-700 to-slate-900", icon: "📝" },
  { id: 4, category: "Toppers' Celebration", label: "JEE Advanced 2025 Toppers", color: "from-[var(--color-gold)] to-amber-600", icon: "🏆" },
  { id: 5, category: "Classrooms", label: "Chemistry Lecture — Organic Reactions", color: "from-[var(--color-teal)] to-cyan-700", icon: "🧪" },
  { id: 6, category: "Campus", label: "Library & Study Hall", color: "from-[var(--color-maroon)] to-red-800", icon: "📚" },
  { id: 7, category: "Events", label: "Parent-Teacher Meet — April 2025", color: "from-violet-700 to-purple-900", icon: "👨‍👩‍👧" },
  { id: 8, category: "Toppers' Celebration", label: "NEET 2025 Selections — 47 Students", color: "from-green-700 to-emerald-900", icon: "🎓" },
  { id: 9, category: "Classrooms", label: "Mathematics — Calculus Master Class", color: "from-[var(--color-maroon)] to-rose-800", icon: "📐" },
  { id: 10, category: "Campus", label: "Canteen & Common Area", color: "from-orange-600 to-amber-800", icon: "☕" },
  { id: 11, category: "Mock Tests", label: "NEET Mock Series — Result Day", color: "from-slate-600 to-slate-800", icon: "📊" },
  { id: 12, category: "Events", label: "Farewell Batch 2025", color: "from-[var(--color-navy)] to-indigo-800", icon: "🎉" },
];

export default function GalleryPage() {
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
            <div className="flex items-center gap-3 flex-wrap justify-center mb-10">
              {CATEGORIES.map((c) => (
                <button key={c} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${c === "All" ? "bg-[var(--color-navy)] text-white" : "bg-[var(--color-slate-light)] text-slate-600 hover:bg-[var(--color-navy)]/10 hover:text-[var(--color-navy)]"}`}>
                  {c}
                </button>
              ))}
            </div>

            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {GALLERY_ITEMS.map((item, i) => (
                <div
                  key={item.id}
                  className={`break-inside-avoid bg-gradient-to-br ${item.color} rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer group ${i % 3 === 0 ? "aspect-square" : i % 3 === 1 ? "aspect-[4/3]" : "aspect-[3/4]"}`}
                >
                  <div className="w-full h-full min-h-[160px] flex flex-col items-center justify-center p-4 relative">
                    <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{item.icon}</div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm p-3">
                      <div className="text-white text-xs font-semibold">{item.label}</div>
                      <div className="text-white/60 text-xs mt-0.5">{item.category}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-slate-500 text-sm mb-4">Follow us on social media for daily updates from the campus.</p>
              <div className="flex items-center justify-center gap-4">
                <a href="#" className="btn-secondary py-2.5 px-6 text-sm">Instagram</a>
                <a href="#" className="btn-secondary py-2.5 px-6 text-sm">YouTube</a>
                <a href="https://wa.me/919999000111" target="_blank" rel="noopener noreferrer" className="btn-primary py-2.5 px-6 text-sm">WhatsApp</a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
