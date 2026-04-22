import { PublicLayout } from "@/components/layout/PublicLayout";

const notices = [
  { date: "20 Apr 2026", title: "New Batch Starting: JEE 2027 Foundation (June 2026)", body: "Registration is now open for our JEE 2027 Foundation batch. Limited seats available. Early bird fee discount applicable till May 15.", tag: "Admissions", urgent: true },
  { date: "18 Apr 2026", title: "Mock Test Series — JEE Mains (Paper 1) Begins May 1", body: "All JEE 2026 batch students are required to appear for the full-length mock test starting May 1. Schedule has been shared on the student portal.", tag: "Exam", urgent: true },
  { date: "15 Apr 2026", title: "Holiday Notice: Institute Closed on April 25", body: "The institute will remain closed on April 25, 2026 for the annual Pooja. Classes will resume as usual on April 26.", tag: "Holiday", urgent: false },
  { date: "12 Apr 2026", title: "Parent-Teacher Meeting: April 30, 2026", body: "A Parent-Teacher Meeting is scheduled for April 30, 2026 from 10:00 AM to 1:00 PM. All parents are requested to attend in person. Slot booking available at the front desk.", tag: "Event", urgent: false },
  { date: "08 Apr 2026", title: "NEET 2026 Registration Reminder", body: "Students preparing for NEET 2026 are reminded to complete their registration on the NTA portal by April 30, 2026. For any assistance, contact Ms. Priya Sharma.", tag: "Exam", urgent: true },
  { date: "01 Apr 2026", title: "Summer Batch Timetable Released", body: "The updated timetable for summer batches (May–June) has been uploaded to the student portal. Please review your class timings and inform the admin of any conflicts.", tag: "Timetable", urgent: false },
  { date: "25 Mar 2026", title: "Digital Notes Updated for Class 11 Physics", body: "Updated chapter-wise notes for Class 11 Physics (Waves & Thermodynamics modules) are now available in the student portal's Study Materials section.", tag: "Academic", urgent: false },
  { date: "20 Mar 2026", title: "Fee Payment Deadline: April 5, 2026", body: "The second installment of fees for the 2025–26 batch is due on April 5, 2026. A late fine of ₹500 will be charged after the due date. Contact the admin for any queries.", tag: "Fees", urgent: false },
];

const tagColors: Record<string, string> = {
  Admissions: "bg-primary/10 text-primary",
  Exam: "bg-[#8B1A1A]/10 text-[#8B1A1A]",
  Holiday: "bg-accent/10 text-accent-foreground",
  Event: "bg-secondary/10 text-secondary",
  Timetable: "bg-muted text-foreground",
  Academic: "bg-primary/10 text-primary",
  Fees: "bg-accent/10 text-accent-foreground",
};

export default function Notices() {
  return (
    <PublicLayout>
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Notice Board</h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Stay updated with the latest announcements, exam schedules, events, and important dates.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="space-y-4">
          {notices.map((n, i) => (
            <div
              key={i}
              className={`bg-card border rounded-2xl p-6 transition-shadow hover:shadow-md ${n.urgent ? "border-l-4 border-l-[#8B1A1A] border-border" : "border-border"}`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${tagColors[n.tag] || "bg-muted text-foreground"}`}>
                    {n.tag}
                  </span>
                  {n.urgent && (
                    <span className="text-xs font-bold text-[#8B1A1A] uppercase tracking-wider">Important</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{n.date}</span>
              </div>
              <h3 className="font-bold text-foreground mb-2">{n.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{n.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-card border border-border rounded-2xl text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Students and parents can access the complete notice archive via the student/parent portal.
          </p>
          <a href="/login" className="inline-flex items-center justify-center px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg text-sm hover:bg-primary/90 transition-colors">
            Login to Portal
          </a>
        </div>
      </div>
    </PublicLayout>
  );
}
