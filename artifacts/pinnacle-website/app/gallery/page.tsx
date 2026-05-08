import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { db } from "@workspace/db";
import { galleryItems } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { CONTACT } from "@/lib/contact";
import { GalleryGrid } from "./GalleryGrid";

export const metadata = {
  title: "Gallery — Pinnacle Academic Classes",
  description: "Photos from classrooms, events, mock tests, and celebrations at Pinnacle Academic Classes, Greater Noida.",
  openGraph: {
    title: "Gallery — Pinnacle Academic Classes",
    description: "Photos from classrooms, events, mock tests, and celebrations at Pinnacle Academic Classes, Greater Noida.",
    url: "/gallery",
    siteName: "Pinnacle Academic Classes",
    type: "website",
    images: [{ url: `/api/og?title=${encodeURIComponent("Gallery — Pinnacle Academic Classes")}&description=${encodeURIComponent("Photos from classrooms, events, mock tests, and celebrations at Pinnacle Academic Classes, Greater Noida.")}`, width: 1200, height: 630, alt: "Gallery — Pinnacle Academic Classes" }],
  },
  twitter: {
    card: "summary_large_image",
    images: [`/api/og?title=${encodeURIComponent("Gallery — Pinnacle Academic Classes")}&description=${encodeURIComponent("Photos from classrooms, events, mock tests, and celebrations at Pinnacle Academic Classes, Greater Noida.")}`],
  },
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const items = await db
    .select()
    .from(galleryItems)
    .where(eq(galleryItems.isVisible, true))
    .orderBy(asc(galleryItems.sortOrder), asc(galleryItems.createdAt));

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
            {items.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <div className="text-5xl mb-4">📷</div>
                <p className="font-semibold text-slate-500">Gallery coming soon</p>
                <p className="text-sm mt-2">Photos will appear here once uploaded by the admin.</p>
              </div>
            ) : (
              <GalleryGrid items={items} />
            )}

            <div className="text-center mt-12">
              <p className="text-slate-500 text-sm mb-4">Follow us on social media for daily updates from the campus.</p>
              <div className="flex items-center justify-center gap-4">
                <a href="#" className="btn-secondary py-2.5 px-6 text-sm">Instagram</a>
                <a href="#" className="btn-secondary py-2.5 px-6 text-sm">YouTube</a>
                <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="btn-primary py-2.5 px-6 text-sm">WhatsApp</a>
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
