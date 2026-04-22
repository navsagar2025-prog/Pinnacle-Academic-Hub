import { PublicLayout } from "@/components/layout/PublicLayout";

const feeTable = [
  { course: "IIT-JEE (Mains + Advanced)", duration: "1 Year", fees: "₹1,20,000", registration: "₹2,000", installments: "3" },
  { course: "IIT-JEE Foundation (Class 11)", duration: "1 Year", fees: "₹80,000", registration: "₹2,000", installments: "2" },
  { course: "NEET Preparation", duration: "1 Year", fees: "₹1,30,000", registration: "₹2,000", installments: "3" },
  { course: "Class 12 PCM / PCB (Full)", duration: "1 Year", fees: "₹40,000", registration: "₹1,000", installments: "2" },
  { course: "Class 12 Commerce", duration: "1 Year", fees: "₹35,000", registration: "₹1,000", installments: "2" },
  { course: "Class 11 Foundation", duration: "1 Year", fees: "₹60,000", registration: "₹1,500", installments: "2" },
  { course: "Class 10 Board Prep", duration: "1 Year", fees: "₹30,000", registration: "₹1,000", installments: "2" },
  { course: "Class 9 & 8 Foundation", duration: "1 Year", fees: "₹25,000", registration: "₹1,000", installments: "2" },
  { course: "Class 6 & 7 Olympiad", duration: "1 Year", fees: "₹20,000", registration: "₹1,000", installments: "2" },
];

const paymentMethods = [
  { title: "UPI / QR Code", desc: "Pay via PhonePe, Google Pay, Paytm, or any UPI app. Scan our QR code at the front desk or use UPI ID: pinnacle@ybl" },
  { title: "NEFT / IMPS Transfer", desc: "Account Name: KCK Corporate Services Pvt. Ltd.\nBank: HDFC Bank\nAccount No: XXXXXXXX1234\nIFSC: HDFC0001234\nBranch: Gaur City, Greater Noida" },
  { title: "Demand Draft", desc: "Payable to KCK Corporate Services Pvt. Ltd., payable at Greater Noida." },
  { title: "Cash", desc: "Cash payments accepted at the institute front desk during office hours (Mon–Sat, 9AM–7PM)." },
];

export default function FeePayment() {
  return (
    <PublicLayout>
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Fee Structure & Payment</h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Transparent fee structure with flexible installment options. Investing in education — always worth it.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-6">Fee Schedule 2026–27</h2>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-primary text-primary-foreground">
                  <tr>
                    <th className="text-left px-6 py-4 font-semibold">Course</th>
                    <th className="text-left px-6 py-4 font-semibold">Duration</th>
                    <th className="text-left px-6 py-4 font-semibold">Course Fee</th>
                    <th className="text-left px-6 py-4 font-semibold">Registration</th>
                    <th className="text-left px-6 py-4 font-semibold">Installments</th>
                  </tr>
                </thead>
                <tbody>
                  {feeTable.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                      <td className="px-6 py-4 font-medium text-foreground">{row.course}</td>
                      <td className="px-6 py-4 text-muted-foreground">{row.duration}</td>
                      <td className="px-6 py-4 font-bold text-primary">{row.fees}</td>
                      <td className="px-6 py-4 text-muted-foreground">{row.registration}</td>
                      <td className="px-6 py-4 text-muted-foreground">{row.installments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-muted/30 border-t border-border text-xs text-muted-foreground">
              * Fees are indicative and subject to revision. Registration fee is non-refundable. Discounts available for siblings and early enrollment. Confirm exact fees with the admin at the time of enrollment.
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-6">Payment Methods</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paymentMethods.map((m, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-bold text-foreground mb-3 text-base">{m.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-accent/10 border border-accent/30 rounded-2xl p-6 md:p-8">
          <h3 className="font-bold text-lg text-primary mb-4">Important Fee Notes</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {[
              "All fees are to be paid before the due date mentioned in the fee schedule.",
              "A late fine of ₹500 per month will be charged for delayed payments.",
              "Students with fee dues will not be permitted to download study materials or appear in tests.",
              "Fee receipts are generated digitally and available in the parent/student portal.",
              "For financial hardship cases, speak confidentially with the Director's office.",
            ].map((note, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-accent shrink-0 mt-0.5 font-bold">✦</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PublicLayout>
  );
}
