import { useState, useEffect } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { adminNavItems } from "./Dashboard";
import { Building2, Phone, IndianRupee, Bell, Database, ScanLine, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { checkApiHealth, saveOcrSettings, fetchOcrSettings } from "@/lib/scan-api";

function Section({ title, icon: Icon, children }: { title: string; icon: React.FC<{ className?: string }>; children: React.ReactNode }) {
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

type OcrProvider = "pix2text" | "simpletex" | "latexocr" | "mathpix" | "google-vision";

const providers: { id: OcrProvider; label: string; cost: string; mathAccuracy: string; requiresKey: string }[] = [
  { id: "pix2text",      label: "Pix2Text",      cost: "Free",    mathAccuracy: "★★★★☆", requiresKey: "Endpoint URL (optional key)" },
  { id: "simpletex",     label: "SimpleTex",     cost: "Free",    mathAccuracy: "★★★★☆", requiresKey: "API Token" },
  { id: "latexocr",      label: "LaTeX-OCR",     cost: "Free",    mathAccuracy: "★★★★☆", requiresKey: "Endpoint URL (optional key)" },
  { id: "mathpix",       label: "MathPix",       cost: "Paid",    mathAccuracy: "★★★★★", requiresKey: "App ID + App Key" },
  { id: "google-vision", label: "Google Vision", cost: "Paid",    mathAccuracy: "★★☆☆☆", requiresKey: "GCP API Key" },
];

function ScanEngineSection() {
  const [activeProvider, setActiveProvider] = useState<OcrProvider>("pix2text");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [appId, setAppId] = useState("");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullConfig, setFullConfig] = useState<Record<string, { endpointUrl: string; hasApiKey?: boolean; hasAppId?: boolean; hasAppKey?: boolean }>>({});

  useEffect(() => {
    fetchOcrSettings()
      .then((cfg) => {
        setFullConfig(cfg.providers ?? {});
        if (cfg.activeProvider && providers.some((p) => p.id === cfg.activeProvider)) {
          setActiveProvider(cfg.activeProvider as OcrProvider);
          const provCfg = cfg.providers?.[cfg.activeProvider] ?? {};
          setEndpointUrl(provCfg.endpointUrl ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const switchProvider = (id: OcrProvider) => {
    setActiveProvider(id);
    const provCfg = fullConfig[id] ?? {};
    setEndpointUrl(provCfg.endpointUrl ?? "");
    setApiKey("");
    setAppId("");
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const h = await checkApiHealth();
      setTestResult({ ok: true, message: `API server online · Active engine: ${h.activeProvider} · Uptime: ${Math.round(h.uptime)}s` });
    } catch {
      setTestResult({ ok: false, message: "API server not reachable. Check that the server is running." });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const providerPayload: Record<string, Record<string, string>> = {};
      if (activeProvider === "mathpix") {
        providerPayload.mathpix = {
          endpointUrl: endpointUrl || "https://api.mathpix.com/v3/text",
          appId,
          appKey: apiKey,
        };
      } else {
        providerPayload[activeProvider] = {
          endpointUrl: endpointUrl || "",
          apiKey,
        };
      }
      await saveOcrSettings({ activeProvider, providers: providerPayload });
      toast.success(`OCR engine switched to ${providers.find((p) => p.id === activeProvider)?.label}`);
    } catch {
      toast.error("Failed to save OCR settings — is the API server running?");
    } finally {
      setSaving(false);
    }
  };

  const selected = providers.find((p) => p.id === activeProvider)!;

  return (
    <Section title="Scan Engine — OCR Provider" icon={ScanLine}>
      <p className="text-sm text-muted-foreground mb-5">
        Choose the OCR engine used for document scanning. Switch providers anytime — no restart required. Pix2Text is recommended as the free default.
        {loading && <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground/70"><Loader2 className="w-3 h-3 animate-spin" />Loading current config…</span>}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {providers.map((p) => (
          <button
            key={p.id}
            onClick={() => switchProvider(p.id)}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              activeProvider === p.id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/40 bg-card"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-foreground">{p.label}</span>
              {activeProvider === p.id && (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              )}
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div className="flex gap-2">
                <span className={`font-medium ${p.cost === "Free" ? "text-green-600" : "text-amber-600"}`}>{p.cost}</span>
                <span>· Math: {p.mathAccuracy}</span>
              </div>
              <div className="text-[11px]">{p.requiresKey}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase">Endpoint URL</Label>
          <Input
            type="url"
            placeholder={
              activeProvider === "mathpix"
                ? "https://api.mathpix.com/v3/text"
                : activeProvider === "google-vision"
                ? "https://vision.googleapis.com/v1/images:annotate"
                : `https://your-${activeProvider}-space.hf.space/ocr`
            }
            value={endpointUrl}
            onChange={(e) => setEndpointUrl(e.target.value)}
          />
        </div>

        {activeProvider === "mathpix" ? (
          <>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">App ID</Label>
              <Input
                type="text"
                placeholder="your_mathpix_app_id"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">App Key</Label>
              <Input
                type="password"
                placeholder="your_mathpix_app_key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">
              API Key {selected.cost === "Free" && activeProvider !== "simpletex" ? "(optional)" : "(required)"}
            </Label>
            <Input
              type="password"
              placeholder={activeProvider === "simpletex" ? "SimpleTex token" : "Bearer token or API key"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
        )}
      </div>

      {testResult && (
        <div className={`flex items-start gap-2 p-3 rounded-lg border mb-4 ${
          testResult.ok
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-destructive/10 border-destructive/20 text-destructive"
        }`}>
          {testResult.ok
            ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          <span className="text-sm">{testResult.message}</span>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleTest}
          disabled={testing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-muted hover:bg-muted/80 text-sm font-medium text-foreground transition-colors disabled:opacity-60"
        >
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Test Connection
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Save Engine Settings
        </button>
      </div>
    </Section>
  );
}

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

      <ScanEngineSection />

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
