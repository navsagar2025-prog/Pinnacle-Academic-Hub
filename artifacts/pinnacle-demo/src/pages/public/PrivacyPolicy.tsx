import { PublicLayout } from "@/components/layout/PublicLayout";

export default function PrivacyPolicy() {
  return (
    <PublicLayout>
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Privacy Policy</h1>
          <p className="text-sm text-primary-foreground/70">Last updated: April 22, 2026</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="prose prose-sm max-w-none text-muted-foreground space-y-8">
          <div>
            <h2 className="text-xl font-serif font-bold text-primary mb-3">1. Information We Collect</h2>
            <p>Pinnacle Academic Classes (a unit of KCK Corporate Services Pvt. Ltd.) collects the following information when you interact with our website, portals, or physical premises:</p>
            <ul className="list-disc pl-5 space-y-1 mt-3">
              <li>Personal details: name, date of birth, class/grade, school name</li>
              <li>Contact information: phone number, email address, residential address</li>
              <li>Academic records: marks, test scores, and performance data within our portal</li>
              <li>Payment information: transaction references (we do not store card or banking credentials)</li>
              <li>Device and browsing data: IP address, browser type, pages visited</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-primary mb-3">2. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-3">
              <li>Process admissions and course enrollment</li>
              <li>Communicate regarding classes, schedules, fees, and notices</li>
              <li>Provide access to our student, parent, and teacher portals</li>
              <li>Share academic performance reports with parents</li>
              <li>Improve our teaching programs and website functionality</li>
              <li>Send important announcements via SMS, email, or WhatsApp</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-primary mb-3">3. Information Sharing</h2>
            <p>We do not sell, rent, or trade your personal information to third parties. We may share data with:</p>
            <ul className="list-disc pl-5 space-y-1 mt-3">
              <li>Service providers who assist in operating our platform (under strict confidentiality)</li>
              <li>Government authorities when required by law</li>
              <li>Payment gateways for fee processing (only transaction reference data is shared)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-primary mb-3">4. Data Security</h2>
            <p>We implement industry-standard technical and organizational measures to protect your data from unauthorized access, disclosure, or loss. All portal communications are encrypted via SSL/TLS.</p>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-primary mb-3">5. Data Retention</h2>
            <p>Student and parent data is retained for the duration of enrollment and for 3 years thereafter for academic record purposes. You may request deletion of your data after this period by writing to us.</p>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-primary mb-3">6. Your Rights</h2>
            <p>You have the right to access, correct, or request deletion of your personal information. To exercise these rights, contact us at: <a href="mailto:privacy@pinnacleacademic.in" className="text-primary underline">privacy@pinnacleacademic.in</a></p>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-primary mb-3">7. Changes to This Policy</h2>
            <p>We reserve the right to update this Privacy Policy. Changes will be communicated via the student portal and our website. Continued use of our services constitutes acceptance of the revised policy.</p>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-primary mb-3">8. Contact</h2>
            <p>For any privacy-related concerns, contact:<br />
              KCK Corporate Services Pvt. Ltd. (Pinnacle Academic Classes)<br />
              Shop No. 1–5, Shop Mart, Plot GH-03, Sector 16C, Gaur City 2, Greater Noida, UP 201009<br />
              Email: <a href="mailto:info@pinnacleacademic.in" className="text-primary underline">info@pinnacleacademic.in</a>
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
