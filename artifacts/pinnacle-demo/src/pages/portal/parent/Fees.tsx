import { PortalLayout } from "@/components/layout/PortalLayout";
import { LayoutDashboard, CreditCard, Calendar, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { label: "Dashboard", href: "/portal/parent", icon: LayoutDashboard },
  { label: "Fee & Payments", href: "/portal/parent/fees", icon: CreditCard },
  { label: "Child's Timetable", href: "/portal/parent/timetable", icon: Calendar },
];

const payments = [
  { date: "15 Jul 2025", description: "Registration Fee", amount: "₹2,000", status: "Paid", receipt: "RCPT-001" },
  { date: "20 Jul 2025", description: "Course Fee — Installment 1", amount: "₹40,000", status: "Paid", receipt: "RCPT-002" },
  { date: "10 Nov 2025", description: "Course Fee — Installment 2", amount: "₹40,000", status: "Paid", receipt: "RCPT-003" },
  { date: "5 May 2026", description: "Course Fee — Installment 3", amount: "₹40,000", status: "Due", receipt: "—" },
];

export default function ParentFees() {
  return (
    <PortalLayout role="parent" navItems={navItems} userName="Mr. Rajesh Mehta" userSub="Parent — Arjun Mehta">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-primary">Fee & Payments</h1>
        <p className="text-muted-foreground text-sm mt-1">Student: Arjun Mehta · JEE 2026 Batch</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <div className="text-xs text-muted-foreground mb-1">Total Fee</div>
          <div className="text-3xl font-bold text-primary">₹1,22,000</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <div className="text-xs text-green-700 mb-1">Amount Paid</div>
          <div className="text-3xl font-bold text-green-700">₹82,000</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 text-center">
          <div className="text-xs text-orange-700 mb-1">Outstanding</div>
          <div className="text-3xl font-bold text-orange-700">₹40,000</div>
          <div className="text-xs text-orange-600 mt-1">Due: May 5, 2026</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-foreground">Payment History</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <span><Button size="sm" disabled>Pay Online</Button></span>
          </TooltipTrigger>
          <TooltipContent><p>Online payment is disabled in demo mode</p></TooltipContent>
        </Tooltip>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-xs text-muted-foreground">Date</th>
                <th className="text-left px-5 py-3 font-semibold text-xs text-muted-foreground">Description</th>
                <th className="text-left px-5 py-3 font-semibold text-xs text-muted-foreground">Amount</th>
                <th className="text-left px-5 py-3 font-semibold text-xs text-muted-foreground">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-xs text-muted-foreground">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="px-5 py-4 text-muted-foreground">{p.date}</td>
                  <td className="px-5 py-4 font-medium">{p.description}</td>
                  <td className="px-5 py-4 font-bold text-primary">{p.amount}</td>
                  <td className="px-5 py-4">
                    {p.status === "Paid"
                      ? <span className="flex items-center gap-1 text-green-600 text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Paid</span>
                      : <span className="flex items-center gap-1 text-orange-600 text-xs font-semibold"><Clock className="w-3.5 h-3.5" /> Due</span>
                    }
                  </td>
                  <td className="px-5 py-4 text-muted-foreground text-xs">{p.receipt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 p-5 bg-muted/30 rounded-xl text-sm text-muted-foreground">
        For fee payment queries, contact the admin: <a href="tel:+919876543210" className="text-primary font-semibold">+91-98765-43210</a> or visit us Mon–Sat, 9am–7pm.
      </div>
    </PortalLayout>
  );
}
