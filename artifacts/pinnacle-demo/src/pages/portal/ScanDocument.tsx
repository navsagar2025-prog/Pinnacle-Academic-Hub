import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import katex from "katex";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { adminNavItems } from "@/pages/portal/admin/Dashboard";
import { teacherNavItems } from "@/pages/portal/teacher/Dashboard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Upload, Camera, X, ScanLine, FileText, FileDown,
  CheckCircle2, AlertCircle, Loader2, ChevronRight, RotateCcw, Eye
} from "lucide-react";
import { scanImage, exportPdf, exportDocx, type OcrResult } from "@/lib/scan-api";

type Step = "capture" | "review" | "export";
type Role = "teacher" | "admin";

function getRole(): Role {
  const r = localStorage.getItem("pinnacle_role");
  return r === "admin" ? "admin" : "teacher";
}

function KatexRenderedLine({ line }: { line: string }) {
  try {
    const html = katex.renderToString(line, {
      displayMode: true,
      throwOnError: true,
      output: "html",
    });
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return (
      <div className="py-0.5">
        <span className="font-mono text-sm text-muted-foreground">{line}</span>
      </div>
    );
  }
}

function KatexRenderer({ latex }: { latex: string }) {
  if (!latex.trim()) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
        <Eye className="w-8 h-8 mb-2 opacity-40" />
        <span>No equations detected</span>
      </div>
    );
  }

  const lines = latex.split("\n").filter((l) => l.trim());
  return (
    <div className="overflow-auto text-sm leading-relaxed space-y-1">
      {lines.map((line, i) => (
        <KatexRenderedLine key={i} line={line} />
      ))}
    </div>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "capture", label: "Capture" },
    { id: "review",  label: "Review" },
    { id: "export",  label: "Export" },
  ];
  const idx = steps.findIndex((s) => s.id === current);

  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
            i < idx  ? "bg-secondary border-secondary text-white" :
            i === idx ? "bg-primary border-primary text-white" :
                        "bg-muted border-border text-muted-foreground"
          }`}>
            {i < idx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
          </div>
          <span className={`text-sm font-medium hidden sm:block ${
            i === idx ? "text-primary" : "text-muted-foreground"
          }`}>{step.label}</span>
          {i < steps.length - 1 && (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  );
}

function CaptureStep({
  onImageSelected,
}: {
  onImageSelected: (file: File, preview: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopWebcam = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setWebcamActive(false);
  }, []);

  const startWebcam = useCallback(async () => {
    setWebcamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      setWebcamActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      setWebcamError("Camera access denied. Please allow camera permissions or upload an image instead.");
    }
  }, []);

  const captureFromWebcam = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "webcam-capture.png", { type: "image/png" });
      const preview = canvas.toDataURL("image/png");
      stopWebcam();
      onImageSelected(file, preview);
    }, "image/png");
  }, [onImageSelected, stopWebcam]);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, WEBP)");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image too large — maximum 20 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      onImageSelected(file, e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [onImageSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  useEffect(() => () => stopWebcam(), [stopWebcam]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-bold text-primary mb-1">Upload or Capture Image</h2>
        <p className="text-sm text-muted-foreground">Supports printed question papers, handwritten notes, and documents with mathematical or scientific equations</p>
      </div>

      {!webcamActive ? (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
              dragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-foreground mb-1">
                {dragging ? "Drop your image here" : "Drag & drop or click to upload"}
              </div>
              <div className="text-sm text-muted-foreground">PNG, JPG, WEBP — up to 20 MB</div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processFile(file);
              }}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={startWebcam}
          >
            <Camera className="w-4 h-4" />
            Use Camera / Webcam
          </Button>

          {webcamError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{webcamError}</p>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-h-[400px] object-contain"
            />
            <button
              onClick={stopWebcam}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          <Button className="w-full gap-2" onClick={captureFromWebcam}>
            <Camera className="w-4 h-4" />
            Capture Photo
          </Button>
        </div>
      )}
    </div>
  );
}

function ReviewStep({
  imagePreview,
  result,
  editedText,
  onTextChange,
  onReset,
  onContinue,
}: {
  imagePreview: string;
  result: OcrResult;
  editedText: string;
  onTextChange: (v: string) => void;
  onReset: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-serif font-bold text-primary mb-1">Review & Edit</h2>
          <p className="text-sm text-muted-foreground">Edit the extracted text if needed, then proceed to export</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-white bg-secondary px-3 py-1 rounded-full">
            {result.provider}
          </span>
          {result.confidence > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {Math.round(result.confidence * 100)}% confidence
            </span>
          )}
          {result.processingMs > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {result.processingMs}ms
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl overflow-hidden border border-border bg-black flex items-center justify-center max-h-48">
          <img src={imagePreview} alt="Scanned document" className="object-contain max-h-48 w-full" />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Extracted Text <span className="text-xs font-normal">(editable)</span>
            </label>
            <textarea
              value={editedText}
              onChange={(e) => onTextChange(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {result.latex && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Equations Preview (KaTeX rendered)
          </label>
          <div className="p-4 rounded-xl border border-border bg-muted/30 overflow-x-auto">
            <KatexRenderer latex={result.latex} />
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <Button variant="outline" onClick={onReset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Scan Again
        </Button>
        <Button onClick={onContinue} className="gap-2">
          Continue to Export
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function ExportStep({
  imagePreview,
  editedText,
  latex,
  provider,
  onReset,
}: {
  imagePreview: string;
  editedText: string;
  latex: string;
  provider: string;
  onReset: () => void;
}) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [title, setTitle] = useState("Scanned Document");

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      await exportPdf({ text: editedText, latex, title, provider });
      toast.success("PDF downloaded successfully");
    } catch {
      toast.error("PDF export failed — is the API server running?");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDocx = async () => {
    setDocxLoading(true);
    try {
      await exportDocx({ text: editedText, latex, title, provider });
      toast.success("DOCX downloaded successfully");
    } catch {
      toast.error("DOCX export failed — is the API server running?");
    } finally {
      setDocxLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-bold text-primary mb-1">Export Document</h2>
        <p className="text-sm text-muted-foreground">Choose a format to download your scanned and OCR-processed document</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Enter document title"
            />
          </div>

          <div className="space-y-3">
            <button
              onClick={handlePdf}
              disabled={pdfLoading}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:shadow-md transition-all bg-card disabled:opacity-60 disabled:cursor-wait group"
            >
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
                {pdfLoading ? (
                  <Loader2 className="w-6 h-6 text-red-600 animate-spin" />
                ) : (
                  <FileDown className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold text-foreground">Download as PDF</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Branded PDF with extracted text and LaTeX source
                </div>
              </div>
            </button>

            <button
              onClick={handleDocx}
              disabled={docxLoading}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-secondary hover:shadow-md transition-all bg-card disabled:opacity-60 disabled:cursor-wait group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                {docxLoading ? (
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                ) : (
                  <FileText className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold text-foreground">Download as Word (.docx)</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Editable Word document with text and LaTeX source
                </div>
              </div>
            </button>
          </div>

          <Button variant="outline" onClick={onReset} className="w-full gap-2">
            <RotateCcw className="w-4 h-4" />
            Scan Another Document
          </Button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden border border-border bg-black flex items-center justify-center max-h-40">
            <img src={imagePreview} alt="Scanned document" className="object-contain max-h-40 w-full" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Text Preview
            </label>
            <div className="p-3 rounded-xl border border-border bg-muted/30 text-sm font-mono text-foreground whitespace-pre-wrap max-h-40 overflow-y-auto">
              {editedText || <span className="text-muted-foreground italic">No text extracted</span>}
            </div>
          </div>
          {latex && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Equations
              </label>
              <div className="p-3 rounded-xl border border-border bg-muted/30 overflow-x-auto">
                <KatexRenderer latex={latex} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ScanDocument() {
  const role = getRole();
  const navItems = role === "admin" ? adminNavItems : teacherNavItems;
  const userName = role === "admin" ? "Admin — Pinnacle" : "Dr. Ramesh Kumar";
  const userSub = role === "admin" ? "Full Access" : "Physics Faculty";

  const [step, setStep] = useState<Step>("capture");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanErrorHint, setScanErrorHint] = useState<string | null>(null);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [editedText, setEditedText] = useState("");

  const handleImageSelected = useCallback(async (file: File, preview: string) => {
    setImageFile(file);
    setImagePreview(preview);
    setScanError(null);
    setScanErrorHint(null);
    setScanning(true);

    try {
      const res = await scanImage(file);
      if (!res.success) {
        setScanError(res.error ?? "OCR failed");
        setScanErrorHint(res.hint ?? null);
        setScanning(false);
        return;
      }
      setResult(res);
      setEditedText(res.text);
      setStep("review");
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setScanning(false);
    }
  }, []);

  const reset = useCallback(() => {
    setStep("capture");
    setImageFile(null);
    setImagePreview("");
    setResult(null);
    setEditedText("");
    setScanError(null);
    setScanErrorHint(null);
    setScanning(false);
  }, []);

  return (
    <PortalLayout role={role} navItems={navItems} userName={userName} userSub={userSub}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <ScanLine className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-primary">Scan Document</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Digitise question papers, handwritten notes, and documents with mathematical equations
            </p>
          </div>
        </div>

        <StepIndicator current={step} />

        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          {scanning && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <ScanLine className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-foreground">Processing image…</div>
                <div className="text-sm text-muted-foreground mt-1">
                  OCR engine is extracting text and equations
                </div>
              </div>
            </div>
          )}

          {!scanning && scanError && (
            <div className="space-y-4">
              <div className="flex flex-col items-start gap-3 p-5 rounded-xl bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                  <span className="font-semibold text-destructive">OCR Failed</span>
                </div>
                <p className="text-sm text-destructive/90">{scanError}</p>
                {scanErrorHint && (
                  <p className="text-sm text-muted-foreground bg-card px-3 py-2 rounded-lg border border-border w-full">
                    💡 {scanErrorHint}
                  </p>
                )}
              </div>
              {imagePreview && (
                <div className="rounded-xl overflow-hidden border border-border bg-black max-h-48 flex items-center justify-center">
                  <img src={imagePreview} alt="Uploaded" className="object-contain max-h-48 w-full" />
                </div>
              )}
              <Button onClick={reset} variant="outline" className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Try Again
              </Button>
            </div>
          )}

          {!scanning && !scanError && step === "capture" && (
            <CaptureStep onImageSelected={handleImageSelected} />
          )}

          {!scanning && !scanError && step === "review" && result && (
            <ReviewStep
              imagePreview={imagePreview}
              result={result}
              editedText={editedText}
              onTextChange={setEditedText}
              onReset={reset}
              onContinue={() => setStep("export")}
            />
          )}

          {!scanning && !scanError && step === "export" && result && (
            <ExportStep
              imagePreview={imagePreview}
              editedText={editedText}
              latex={result.latex}
              provider={result.provider}
              onReset={reset}
            />
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
