import { PortalLayout } from "@/components/layout/PortalLayout";
import { adminNavItems } from "./Dashboard";
import { Building2, Phone, Mail, MapPin, Globe, IndianRupee, Shield, Bell, Palette, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function Section({ title, icon: Icon, children }: { title: string; icon: React.FC<any>; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-5">
      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-border">
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, type = "text", multiline }: { label: string; value: string; type?: string; multiline?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-semibold text-muted-foreground uppercase">{label}</Label>
      {multiline
        ? <Textarea defaultValue={value} className="resize-none" rows={2} disabled />
        : <Input type={type} defaultValue={value} disabled />}
    </div>
  );
}

function DemoSaveBtn({ label = "Save Changes" }: { label?: string }) {
  return (
    <button disabled title="Demo mode — editing enabled in production" className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold opacity-50 cursor-not-allowed">
      {label}
    </button>
  );
}

const feeStructure = [
  { course: "IIT-JEE (Mains + Advanced)", annual: "₹1,00,000", half: "₹52,000", registration: "₹2,000" },
  { course: "NEET Preparation",           annual: "₹1,05,000", half: "₹54,000", registration: "₹2,000" },
  { course: "Class 12 Boards (PCM/PCB)",  annual: "₹40,000",  half: "₹21,000", registration: "₹1,000" },
  { course: "Class 12 Commerce",          annual: "₹35,000",  half: "₹18,500", registration: "₹1,000" },
  { course: "Class 11 Foundation",        annual: "₹60,000",  half: "₹31,000", registration: "₹1,500" },
  { course: "Class 10 / 9 / 8",          annual: "₹25,000",  half: "₹13,000", registration: "₹1,000" },
];

export default function AdminSettings() {
  return (
    <PortalLayout role="admin" navItems={adminNavItems} userName="Admin — Pinnacle" userSub="Full Access">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-primary">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure institute details, fee structure, and system preferences</p>
      </div>

      <Section title="Institute Information" icon={Building2}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Institute Name" value="Pinnacle Academic Classes" />
          <Field label="Legal Entity" value="KCK Corporate Services Pvt. Ltd." />
          <Field label="GST Number" value="09AABCK1234F1ZX" />
          <Field label="Established Year" value="2012" />
          <div className="md:col-span-2">
            <Field label="Address" value="Shop No. 1–5, Shop Mart, Plot GH-03, Sector 16C, Gaur City 2, Greater Noida, UP 201009" multiline />
          </div>
        </div>
        <DemoSaveBtn />
      </Section>

      <Section title="Contact Information" icon={Phone}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Primary Phone" value="+91-98765-43210" type="tel" />
          <Field label="WhatsApp" value="+91-98765-43210" type="tel" />
          <Field label="Email" value="info@pinnacleacademic.in" type="email" />
          <Field label="Website" value="www.pinnacleacademic.in" />
          <Field label="Facebook" value="fb.com/pinnaclegautambuddhnagar" />
          <Field label="Instagram" value="@pinnacle_gbc" />
        </div>
        <DemoSaveBtn />
      </Section>

      <Section title="Fee Structure" icon={IndianRupee}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase">Course</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase">Annual</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase">Half-Yearly</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase">Registration</th>
              </tr>
            </thead>
            <tbody>
              {feeStructure.map((f, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="py-2 px-3 font-medium text-foreground">{f.course}</td>
                  <td className="py-2 px-3 text-foreground">{f.annual}</td>
                  <td className="py-2 px-3 text-foreground">{f.half}</td>
                  <td className="py-2 px-3 text-foreground">{f.registration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DemoSaveBtn label="Update Fee Structure" />
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Section title="Notifications" icon={Bell}>
          <div className="space-y-3">
            {["Fee due reminders (7 days prior)", "Attendance below 75% alerts", "New enquiry notifications", "Exam result published alerts"].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{item}</span>
                <div className="w-10 h-5 bg-secondary rounded-full opacity-50 cursor-not-allowed" title="Demo mode" />
              </div>
            ))}
          </div>
          <DemoSaveBtn />
        </Section>

        <Section title="Data & Backup" icon={Database}>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Last backup: <span className="text-foreground font-medium">22 Apr 2026, 3:00 AM</span></p>
            <p>Database size: <span className="text-foreground font-medium">142 MB</span></p>
            <p>Storage used: <span className="text-foreground font-medium">2.4 GB / 10 GB</span></p>
          </div>
          <div className="flex gap-2 mt-4">
            <button disabled title="Demo mode" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold opacity-50 cursor-not-allowed">Backup Now</button>
            <button disabled title="Demo mode" className="px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-semibold opacity-50 cursor-not-allowed">Export All Data</button>
          </div>
        </Section>
      </div>
    </PortalLayout>
  );
}
