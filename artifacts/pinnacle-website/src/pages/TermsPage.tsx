import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const SECTIONS = [
  { title: "1. Acceptance of Terms", body: "By enrolling at Pinnacle Academic Classes or using our website and portals, you agree to these Terms & Conditions. These terms govern your relationship with KCK Corporate Services Pvt. Ltd." },
  { title: "2. Enrolment and Admission", body: "Admission is subject to seat availability and completion of the admission process including payment of the admission fee. Seats are confirmed only upon receipt of the admission fee. Pinnacle reserves the right to refuse admission without providing reasons." },
  { title: "3. Fees and Payment", body: "All fees must be paid as per the schedule provided at the time of admission. Late payment may attract a late fee of ₹200 per week after the due date. Fees are subject to revision at the start of each academic year." },
  { title: "4. Attendance Policy", body: "Students are expected to maintain a minimum of 75% attendance in all subjects. Failure to maintain attendance may result in withholding of test results or study materials. Regular attendance is essential for optimal learning outcomes." },
  { title: "5. Conduct and Discipline", body: "Students are expected to maintain discipline, respect faculty and fellow students, and adhere to the institute's code of conduct. Pinnacle reserves the right to expel a student for misconduct without refund of fees." },
  { title: "6. Digital Portal and Content", body: "Study materials, recorded lectures, and practice papers available on the student portal are proprietary to Pinnacle Academic Classes and may not be shared, copied, or distributed without written permission." },
  { title: "7. Limitation of Liability", body: "Pinnacle Academic Classes provides quality education and is committed to student success. However, we do not guarantee specific exam results or ranks. Results depend on individual student effort, aptitude, and preparation." },
  { title: "8. Governing Law", body: "These terms are governed by the laws of India and the jurisdiction of courts in Greater Noida, Uttar Pradesh." },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="bg-[var(--color-navy)] py-12">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="font-[family-name:var(--font-playfair)] text-white text-3xl font-bold">Terms & Conditions</h1>
            <p className="text-white/60 mt-2 text-sm">Last updated: 1 January 2026 · KCK Corporate Services Pvt. Ltd.</p>
          </div>
        </section>
        <section className="py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            {SECTIONS.map((s) => (
              <div key={s.title} className="mb-8">
                <h2 className="font-bold text-[var(--color-navy)] text-lg font-[family-name:var(--font-playfair)] mb-3">{s.title}</h2>
                <p className="text-slate-600 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
