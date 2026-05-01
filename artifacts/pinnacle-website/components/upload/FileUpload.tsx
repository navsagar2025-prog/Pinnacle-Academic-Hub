"use client";

import { useRef, useState } from "react";
import { Upload, CheckCircle, AlertCircle, X, FileText, Image } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

export type FileUploadAccept = "pdf" | "image" | "any";

interface Props {
  accept?: FileUploadAccept;
  label?: string;
  hint?: string;
  currentUrl?: string;
  onUploaded: (objectPath: string, servingUrl: string) => void;
  disabled?: boolean;
  className?: string;
}

const ACCEPT_MAP: Record<FileUploadAccept, string> = {
  pdf: "application/pdf",
  image: "image/jpeg,image/jpg,image/png,image/webp,image/gif",
  any: "application/pdf,image/jpeg,image/jpg,image/png,image/webp,image/gif",
};

const ACCEPT_LABEL: Record<FileUploadAccept, string> = {
  pdf: "PDF only, max 20 MB",
  image: "JPG, PNG, WebP or GIF, max 5 MB",
  any: "PDF (max 20 MB) or image (max 5 MB)",
};

export default function FileUpload({
  accept = "any",
  label = "Upload File",
  hint,
  currentUrl,
  onUploaded,
  disabled = false,
  className = "",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadedName, setUploadedName] = useState("");

  async function handleFile(file: File) {
    setStatus("uploading");
    setProgress(10);
    setErrorMsg("");
    setUploadedName(file.name);

    try {
      const metaRes = await fetch(`${BASE}/api/v1/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });

      if (!metaRes.ok) {
        const err = await metaRes.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `Server error ${metaRes.status}`);
      }

      const { uploadURL, objectPath } = (await metaRes.json()) as {
        uploadURL: string;
        objectPath: string;
      };

      setProgress(40);

      const putRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!putRes.ok) throw new Error("Upload to storage failed");

      setProgress(100);
      setStatus("done");

      const servingUrl = `${BASE}/api/v1/storage${objectPath}`;
      onUploaded(objectPath, servingUrl);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function reset() {
    setStatus("idle");
    setProgress(0);
    setErrorMsg("");
    setUploadedName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const isUploading = status === "uploading";

  return (
    <div className={`space-y-2 ${className}`}>
      {status === "idle" && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer
            ${disabled ? "opacity-50 cursor-not-allowed border-slate-200" : "border-slate-200 hover:border-[var(--color-teal)]/60 hover:bg-[var(--color-slate-light)]"}`}
        >
          {accept === "pdf" ? (
            <FileText size={24} className="text-slate-400 mx-auto mb-2" />
          ) : (
            <Image size={24} className="text-slate-400 mx-auto mb-2" />
          )}
          <p className="text-sm font-semibold text-[var(--color-navy)]">{label}</p>
          <p className="text-xs text-slate-400 mt-1">{hint ?? ACCEPT_LABEL[accept]}</p>
          {currentUrl && (
            <p className="text-xs text-[var(--color-teal)] mt-2 truncate">Current file set</p>
          )}
        </div>
      )}

      {isUploading && (
        <div className="border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-[var(--color-navy)]">
            <Upload size={14} className="animate-bounce" />
            <span className="truncate">Uploading {uploadedName}…</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-teal)] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 text-sm text-green-700">
          <CheckCircle size={14} />
          <span className="flex-1 truncate">{uploadedName} uploaded</span>
          <button type="button" onClick={reset} className="text-green-500 hover:text-green-700">
            <X size={14} />
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-[var(--color-maroon)]">
          <AlertCircle size={14} />
          <span className="flex-1">{errorMsg}</span>
          <button type="button" onClick={reset} className="text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_MAP[accept]}
        onChange={handleChange}
        disabled={disabled || isUploading}
        className="hidden"
      />
    </div>
  );
}
