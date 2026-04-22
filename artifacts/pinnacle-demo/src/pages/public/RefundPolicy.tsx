import { PublicLayout } from "@/components/layout/PublicLayout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const policies = [
  {
    window: "Within 7 days of enrollment",
    refund: "80% of course fee",
    note: "Registration fee (₹1,000–₹2,000) is non-refundable in all cases.",
  },
  {
    window: "8–15 days of enrollment",
    refund: "70% of course fee",
    note: "Applicable only if no more than 5 classes have been attended.",
  },
  {
    window: "16–30 days of enrollment",
    refund: "50% of course fee",
    note: "Applicable only if student has attended fewer than 10 classes.",
  },
  {
    window: "After 30 days",
    refund: "No refund",
    note: "Exceptional medical or personal circumstances may be considered by the Director at their discretion.",
  },
];

export default function RefundPolicy() {
  return (
    <PublicLayout>
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Refund Policy</h1>
          <p className="text-sm text-primary-foreground/70">Last updated: April 22, 2026</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-10">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-primary text-primary-foreground">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold">Withdrawal Period</th>
                  <th className="text-left px-6 py-4 font-semibold">Refund Amount</th>
                  <th className="text-left px-6 py-4 font-semibold">Conditions</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((p, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                    <td className="px-6 py-4 font-medium text-foreground">{p.window}</td>
                    <td className="px-6 py-4 font-bold text-primary">{p.refund}</td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">{p.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-8 text-muted-foreground text-sm leading-relaxed">
          <div>
            <h2 className="text-xl font-serif font-bold text-primary mb-3">How to Apply for a Refund</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Submit a written withdrawal request to the institute admin in person or via email at <a href="mailto:info@pinnacleacademic.in" className="text-primary underline">info@pinnacleacademic.in</a>.</li>
              <li>Include: student name, enrollment ID, course, reason for withdrawal, and bank details for refund transfer.</li>
              <li>The request will be reviewed and processed within 10–15 working days of approval.</li>
              <li>Refunds are transferred via NEFT/IMPS to the bank account registered at enrollment.</li>
            </ol>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-primary mb-3">Non-Refundable Items</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Registration / enrollment fee</li>
              <li>Cost of any study materials already issued or accessed digitally</li>
              <li>Test fees for any tests already appeared</li>
              <li>Any applicable late payment fines</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-primary mb-3">Special Circumstances</h2>
            <p>In cases of severe illness, family emergencies, or relocation, the Director may approve exceptions on a case-by-case basis. Supporting documents (medical certificate, etc.) will be required. Contact the admin office for more information.</p>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
            <h3 className="font-bold text-primary mb-2">Have a Query?</h3>
            <p className="mb-4">If you have any questions about refunds, our admin team is happy to help.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="tel:+919876543210">
                <Button size="sm">Call +91-98765-43210</Button>
              </a>
              <Link href="/contact">
                <Button variant="outline" size="sm">Send a Message</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
