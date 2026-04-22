import { PublicLayout } from "@/components/layout/PublicLayout";

export default function Terms() {
  return (
    <PublicLayout>
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Terms & Conditions</h1>
          <p className="text-sm text-primary-foreground/70">Last updated: April 22, 2026</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="prose prose-sm max-w-none text-muted-foreground space-y-8">
          <div>
            <h2 className="text-xl font-serif font-bold text-primary mb-3">1. Acceptance of Terms</h2>
            <p>By enrolling at Pinnacle Academic Classes (operated by KCK Corporate Services Pvt. Ltd.) or using our digital platforms, you agree to these Terms & Conditions in full. If you do not agree, please do not use our services.</p>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-primary mb-3">2. Enrollment & Eligibility</h2>
            <p>Enrollment is subject to seat availability and satisfactory completion of the counselling process. We reserve the right to admit or decline any applicant at our discretion. Providing false information during enrollment will result in immediate cancellation without refund.</p>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-primary mb-3">3. Fees & Payments</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>All fees must be paid by the due dates specified in the fee schedule.</li>
              <li>Late payments attract a fine of ₹500/month.</li>
              <li>Students with outstanding dues will be barred from accessing study materials and appearing in tests.</li>
              <li>Registration fees are non-refundable under all circumstances.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-primary mb-3">4. Attendance Policy</h2>
            <p>A minimum of 75% attendance is mandatory. Students failing to maintain this threshold will not be eligible for internal assessments and may be asked to withdraw from the batch. Parents will be notified in case of consistent absenteeism.</p>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-primary mb-3">5. Code of Conduct</h2>
            <p>Students are expected to maintain respectful behaviour towards faculty, staff, and fellow students at all times — both in person and on digital platforms. Disruptive, disrespectful, or inappropriate behaviour may result in suspension or expulsion without fee refund.</p>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-primary mb-3">6. Digital Portal Usage</h2>
            <p>Portal credentials are personal and must not be shared. Any unauthorized use of portal credentials is the student's/parent's responsibility. Study materials provided through the portal are for personal use only and may not be reproduced or distributed.</p>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-primary mb-3">7. Intellectual Property</h2>
            <p>All study materials, test papers, notes, and digital content are the intellectual property of Pinnacle Academic Classes. Reproduction, sharing, or commercial use without written permission is strictly prohibited and may attract legal action.</p>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-primary mb-3">8. Limitation of Liability</h2>
            <p>Pinnacle Academic Classes provides coaching and educational support. We do not guarantee specific exam results or ranks. Our liability is limited to the fee paid for the relevant course period.</p>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-primary mb-3">9. Governing Law</h2>
            <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Greater Noida, Uttar Pradesh.</p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
