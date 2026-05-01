import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { db } from "@workspace/db";
import { notices } from "@workspace/db/schema";
import { desc } from "drizzle-orm";
import { Bell } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notices & Announcements | Pinnacle Academic Classes",
  description: "Latest notices, events, and announcements from Pinnacle Academic Classes, Gaur City 2, Sec. 16C, Greater Noida — 201009.",
  openGraph: {
    title: "Notices & Announcements | Pinnacle Academic Classes",
    description: "Latest notices, events, and announcements from Pinnacle Academic Classes, Gaur City 2, Sec. 16C, Greater Noida — 201009.",
    url: "https://paconline.in/notices",
    siteName: "Pinnacle Academic Classes",
    type: "website",
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  Test: "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]",
  Fee: "bg-[var(--color-gold)]/15 text-[var(--color-navy)]",
  Admissions: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
  Event: "bg-[var(--color-navy)]/10 text-[var(--color-navy)]",
  Academic: "bg-purple-50 text-purple-700",
};

export default async function NoticesPage() {
  const allNotices = await db.select().from(notices).orderBy(desc(notices.publishedAt));

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-[var(--color-navy)] py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="badge-gold mb-4 inline-block">Updates</span>
            <h1 className="font-[family-name:var(--font-playfair)] text-white text-4xl font-bold">
              Notice Board
            </h1>
            <p className="text-white/70 text-lg mt-4">
              Stay up to date with the latest announcements, events, and academic updates.
            </p>
          </div>
        </section>
        <section className="py-16 bg-[var(--color-slate-light)]">
          <div className="max-w-3xl mx-auto px-4 space-y-4">
            {allNotices.length === 0 ? (
              <div className="card text-center py-12 text-slate-400">No notices at this time. Check back soon.</div>
            ) : (
              allNotices.map((n) => (
                <div key={n.id} className="card hover:shadow-elevated transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[var(--color-teal)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Bell size={18} className="text-[var(--color-teal)]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`badge text-xs ${CATEGORY_COLORS[n.category] ?? "bg-slate-100 text-slate-600"}`}>{n.category}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(n.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      </div>
                      <h2 className="font-bold text-[var(--color-navy)] mb-2 font-[family-name:var(--font-playfair)]">{n.title}</h2>
                      <p className="text-slate-600 text-sm leading-relaxed">{n.body}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
