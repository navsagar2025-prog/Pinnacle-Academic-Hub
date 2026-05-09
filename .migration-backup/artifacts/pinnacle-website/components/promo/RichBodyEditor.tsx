"use client";
/**
 * Minimal rich-text editor for promotion body text.
 * Uses the browser's native contentEditable + execCommand API (zero dependencies).
 * Supports: Bold · Italic · Underline · Insert Link · Clear formatting.
 * Outputs clean HTML stored directly in the promotions.body column.
 */
import { useEffect, useRef } from "react";
import { Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, RemoveFormatting } from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichBodyEditor({ value, onChange, placeholder = "Write your announcement…" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Sync value → DOM only on mount or when value is externally reset.
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exec(cmd: string, value?: string) {
    ref.current?.focus();
    document.execCommand(cmd, false, value);
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function insertLink() {
    const url = window.prompt("Enter URL:", "https://");
    if (!url) return;
    exec("createLink", url);
  }

  const toolbarBtn = "p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors";

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[var(--color-teal)]">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 bg-slate-50">
        <button type="button" title="Bold" className={toolbarBtn} onMouseDown={(e) => { e.preventDefault(); exec("bold"); }}>
          <Bold size={13} />
        </button>
        <button type="button" title="Italic" className={toolbarBtn} onMouseDown={(e) => { e.preventDefault(); exec("italic"); }}>
          <Italic size={13} />
        </button>
        <button type="button" title="Underline" className={toolbarBtn} onMouseDown={(e) => { e.preventDefault(); exec("underline"); }}>
          <UnderlineIcon size={13} />
        </button>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <button type="button" title="Insert link" className={toolbarBtn} onMouseDown={(e) => { e.preventDefault(); insertLink(); }}>
          <LinkIcon size={13} />
        </button>
        <button type="button" title="Remove formatting" className={toolbarBtn} onMouseDown={(e) => { e.preventDefault(); exec("removeFormat"); }}>
          <RemoveFormatting size={13} />
        </button>
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => { if (ref.current) onChange(ref.current.innerHTML); }}
        data-placeholder={placeholder}
        className={[
          "min-h-[80px] px-3 py-2 text-sm text-slate-800 outline-none",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400",
        ].join(" ")}
      />
    </div>
  );
}
